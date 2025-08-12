import express from "express";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Microlink.io API function to generate thumbnail and logo
async function generateMicrolinkAssets(url) {
  try {
    console.log("🖼️ Generating Microlink.io assets for:", url);

    // Generate thumbnail (16:9 aspect ratio - 1200x675)
    const thumbnailResponse = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&width=1200&height=675&format=png&meta=false`
    );

    // Get metadata including logo
    const metadataResponse = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true`
    );

    // Log rate limit headers for usage tracking
    console.log("📊 Microlink.io Rate Limit Info:");
    console.log("Thumbnail API Headers:", Object.fromEntries(thumbnailResponse.headers.entries()));
    console.log("Metadata API Headers:", Object.fromEntries(metadataResponse.headers.entries()));

    const thumbnailData = await thumbnailResponse.json();
    const metadataData = await metadataResponse.json();

    console.log("📸 Thumbnail response:", thumbnailData);
    console.log("🎨 Metadata response:", metadataData);

    // Extract logo URL from metadata
    let logoUrl = "";
    if (metadataData.data?.logo?.url) {
      logoUrl = metadataData.data.logo.url;
      console.log("✅ Logo found:", logoUrl);
    } else if (metadataData.data?.image?.url) {
      logoUrl = metadataData.data.image.url;
      console.log("✅ Fallback image found:", logoUrl);
    } else if (metadataData.data?.favicon?.url) {
      // Only use favicon as last resort, and check if it's a proper image
      const faviconUrl = metadataData.data.favicon.url;
      if (faviconUrl && !faviconUrl.includes('favicon.ico')) {
        logoUrl = faviconUrl;
        console.log("✅ Favicon found (non-ico):", logoUrl);
      } else {
        console.log("⚠️ Skipping problematic favicon.ico URL");
      }
    } else {
      console.log("⚠️ No logo, image, or usable favicon found in metadata");
    }

    return {
      thumbnail_url: thumbnailData.data?.screenshot?.url || "",
      logo_url: logoUrl
    };
  } catch (error) {
    console.error("❌ Microlink.io error:", error.message);
    return {
      thumbnail_url: "",
      logo_url: ""
    };
  }
}

app.post("/generatelaunchdata", async (req, res) => {
  const { url, user_id } = req.body;
  console.log("🔍 Received from frontend:", { url, user_id });

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  try {
    const htmlResponse = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await htmlResponse.text();

    // Generate Microlink.io assets (thumbnail + logo)
    console.log("🖼️ Generating Microlink.io assets...");
    const microlinkAssets = await generateMicrolinkAssets(url);
    console.log("✅ Microlink assets generated:", microlinkAssets);

    const prompt = `
      You are a data extraction AI. Extract information from this website and return ONLY a valid JSON object with no additional text.
      
      Required JSON format:
      {
        "name": "company/product name",
        "tagline": "short compelling tagline",
        "description": "detailed description (2-3 sentences)",
        "category": "detected category (saas, ai, fintech, ecommerce, etc.)",
        "features": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "emails": ["email@example.com"],
        "social_links": ["https://twitter.com/...", "https://linkedin.com/..."],
        "other_links": ["https://app.example.com", "https://github.com/..."]
      }
      
      Website HTML (first 7000 chars):
      ${html.slice(0, 7000)}
      
      Return only the JSON object, no other text:
    `;

    console.log("🤖 Calling OpenAI API...");
    let gptresponse;
    try {
      gptresponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      });
    } catch (openaiError) {
      console.error("❌ OpenAI API error:", openaiError.message);
      return res.status(500).json({
        err: true,
        message: "OpenAI API failed: " + openaiError.message
      });
    }

    console.log("📝 Raw GPT response:", gptresponse.choices[0].message.content);

    let result;
    try {
      const rawContent = gptresponse.choices[0].message.content.trim();
      // Remove any markdown code blocks if present
      const jsonContent = rawContent.replace(/```json\s*|\s*```/g, '').trim();
      result = JSON.parse(jsonContent);
    } catch (e) {
      console.error("❌ GPT JSON parse error:", gptresponse.choices[0].message.content);
      console.error("❌ Parse error details:", e.message);

      // Fallback: create basic data from URL
      const fallbackResult = {
        name: url.replace(/https?:\/\/(www\.)?/, '').split('/')[0].replace(/\./g, ' ').toUpperCase(),
        tagline: "Innovative solution for modern needs",
        description: "This product offers cutting-edge features designed to solve real-world problems and enhance user experience.",
        category: "startup ecosystem",
        features: ["User-friendly", "Scalable", "Secure"],
        emails: [],
        social_links: [],
        other_links: []
      };

      console.log("🔄 Using fallback data:", fallbackResult);
      result = fallbackResult;
    }

    // Don't insert automatically - just return the extracted data
    console.log("✅ AI extraction successful:", result);
    console.log("🔍 Result keys:", Object.keys(result));
    console.log("📂 Category from AI:", result.category);
    console.log("🏷️ Features from AI:", result.features);

    // Return the data in the format expected by frontend
    const responseData = {
      name: result.name || "",
      website_url: url,
      tagline: result.tagline || "",
      description: result.description || "",
      category: result.category || "",
      links: [...(result.social_links || []), ...(result.other_links || [])],
      features: result.features || [],
      logo_url: microlinkAssets.logo_url,
      thumbnail_url: microlinkAssets.thumbnail_url,
      success: true
    };

    console.log("📤 Sending response to frontend:", responseData);
    res.json(responseData);

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: true, message: err.message });
  }
});

app.listen(3001, () =>
  console.log("🧠 AI backend running at http://localhost:3001")
);
