import express from "express";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import cors from "cors";
import { moderateContent, semanticSearch, generateEmbedding } from "./utils/aiUtils.js";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://launchit.site', 'https://launchitsite.netlify.app']
    : true,
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple in-memory rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per 15 minutes

const rateLimitMiddleware = (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const clientData = requestCounts.get(clientId);
    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + RATE_LIMIT_WINDOW;
    } else if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        error: true,
        message: 'Rate limit exceeded. Please try again later.'
      });
    } else {
      clientData.count++;
    }
  }
  next();
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Microlink.io API function to generate thumbnail and logo
async function generateMicrolinkAssets(url) {
  try {
    // Generate thumbnail (16:9 aspect ratio - 1200x675)
    const thumbnailResponse = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&width=1200&height=675&format=png&meta=false`
    );

    // Get metadata including logo
    const metadataResponse = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true`
    );

    const thumbnailData = await thumbnailResponse.json();
    const metadataData = await metadataResponse.json();

    // Extract logo URL from metadata
    let logoUrl = "";
    if (metadataData.data?.logo?.url) {
      logoUrl = metadataData.data.logo.url;
    } else if (metadataData.data?.image?.url) {
      logoUrl = metadataData.data.image.url;
    } else if (metadataData.data?.favicon?.url) {
      // Only use favicon as last resort, and check if it's a proper image
      const faviconUrl = metadataData.data.favicon.url;
      if (faviconUrl && !faviconUrl.includes('favicon.ico')) {
        logoUrl = faviconUrl;
      }
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

app.post("/generatelaunchdata", rateLimitMiddleware, async (req, res) => {
  const { url, user_id } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  try {
    const htmlResponse = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await htmlResponse.text();

    // Generate Microlink.io assets (thumbnail + logo)
    const microlinkAssets = await generateMicrolinkAssets(url);

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

      result = fallbackResult;
    }

    // Don't insert automatically - just return the extracted data
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

    res.json(responseData);

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: true, message: err.message });
  }
});

// ==================== AI FEATURES ENDPOINTS ====================

// 1. CONTENT MODERATION ENDPOINT
app.post('/api/moderate', rateLimitMiddleware, async (req, res) => {
  try {
    const { content, contentType, userId } = req.body;

    if (!content || !contentType) {
      return res.status(400).json({
        error: true,
        message: 'Content and contentType are required'
      });
    }

    // Moderate the content
    const moderationResult = await moderateContent(content);

    // Determine action based on moderation level
    let action = 'approve';
    let message = 'Content approved';

    if (moderationResult.moderationLevel === 'flagged') {
      if (moderationResult.issues.some(issue =>
        issue.includes('Hate speech') ||
        issue.includes('Self-harm') ||
        issue.includes('Violent content')
      )) {
        action = 'reject';
        message = 'Content rejected - violates community guidelines';
      } else {
        action = 'review';
        message = 'Content flagged for admin review';
      }
    }

    // Store moderation record in database
    const { error: dbError } = await supabase
      .from('content_moderation')
      .insert({
        user_id: userId,
        content: content,
        content_type: contentType,
        moderation_result: moderationResult,
        action: action,
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending_review',
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    res.json({
      success: true,
      action: action,
      message: message,
      moderationResult: moderationResult,
      requiresReview: action === 'review'
    });

  } catch (error) {
    console.error('❌ Content moderation error:', error);
    res.status(500).json({
      error: true,
      message: 'Content moderation failed: ' + error.message
    });
  }
});

// 2. SEMANTIC SEARCH ENDPOINT
app.post('/api/search/semantic', rateLimitMiddleware, async (req, res) => {
  try {
    const { query, limit = 10, filters = {} } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: true,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Get all projects from database
    let { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      throw new Error('Failed to fetch projects: ' + fetchError.message);
    }

    if (!projects || projects.length === 0) {
      return res.json({
        success: true,
        results: [],
        total: 0,
        query: query
      });
    }

    // Generate embeddings for projects that don't have them
    const projectsWithEmbeddings = await Promise.all(
      projects.map(async (project) => {
        if (!project.embedding) {
          try {
            const projectText = [
              project.title || '',
              project.description || '',
              project.category || '',
              project.tags ? project.tags.join(' ') : ''
            ].join(' ').trim();

            if (projectText) {
              const embedding = await generateEmbedding(projectText);

              // Store embedding in database
              await supabase
                .from('projects')
                .update({ embedding: embedding })
                .eq('id', project.id);

              return { ...project, embedding };
            }
          } catch (error) {
            console.error(`Failed to generate embedding for project ${project.id}:`, error);
          }
        }
        return project;
      })
    );

    // Perform semantic search
    const searchResults = await semanticSearch(query, projectsWithEmbeddings, limit);

    // Apply additional filters if provided
    let filteredResults = searchResults;

    if (filters.category) {
      filteredResults = filteredResults.filter(project =>
        project.category === filters.category
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredResults = filteredResults.filter(project =>
        project.tags && filters.tags.some(tag => project.tags.includes(tag))
      );
    }

    res.json({
      success: true,
      results: filteredResults,
      total: filteredResults.length,
      query: query,
      searchTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Semantic search error:', error);
    res.status(500).json({
      error: true,
      message: 'Semantic search failed: ' + error.message
    });
  }
});

// 3. GENERATE EMBEDDINGS FOR EXISTING PROJECTS
app.post('/api/embeddings/generate', rateLimitMiddleware, async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        error: true,
        message: 'Project ID is required'
      });
    }

    // Get project data
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({
        error: true,
        message: 'Project not found'
      });
    }

    // Generate embedding
    const projectText = [
      project.title || '',
      project.description || '',
      project.category || '',
      project.tags ? project.tags.join(' ') : ''
    ].join(' ').trim();

    if (!projectText) {
      return res.status(400).json({
        error: true,
        message: 'Project has no text content for embedding'
      });
    }

    const embedding = await generateEmbedding(projectText);

    // Update project with embedding
    const { error: updateError } = await supabase
      .from('projects')
      .update({ embedding: embedding })
      .eq('id', projectId);

    if (updateError) {
      throw new Error('Failed to update project: ' + updateError.message);
    }

    res.json({
      success: true,
      message: 'Embedding generated successfully',
      projectId: projectId
    });

  } catch (error) {
    console.error('❌ Embedding generation error:', error);
    res.status(500).json({
      error: true,
      message: 'Embedding generation failed: ' + error.message
    });
  }
});

// 4. GET MODERATION QUEUE (Admin only)
app.get('/api/moderation/queue', rateLimitMiddleware, async (req, res) => {
  try {
    const { status = 'pending_review', limit = 50 } = req.query;

    // TODO: Add admin authentication check
    // For now, allow access to moderation queue

    const { data: moderationRecords, error } = await supabase
      .from('content_moderation')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      throw new Error('Failed to fetch moderation queue: ' + error.message);
    }

    res.json({
      success: true,
      records: moderationRecords || [],
      total: moderationRecords ? moderationRecords.length : 0,
      status: status
    });

  } catch (error) {
    console.error('❌ Moderation queue error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch moderation queue: ' + error.message
    });
  }
});

// 5. UPDATE MODERATION STATUS (Admin only)
app.put('/api/moderation/status', rateLimitMiddleware, async (req, res) => {
  try {
    const { recordId, action, adminNotes } = req.body;

    if (!recordId || !action) {
      return res.status(400).json({
        error: true,
        message: 'Record ID and action are required'
      });
    }

    // TODO: Add admin authentication check

    const { error } = await supabase
      .from('content_moderation')
      .update({
        status: action,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin' // TODO: Replace with actual admin user ID
      })
      .eq('id', recordId);

    if (error) {
      throw new Error('Failed to update moderation status: ' + error.message);
    }

    res.json({
      success: true,
      message: 'Moderation status updated successfully',
      recordId: recordId,
      action: action
    });

  } catch (error) {
    console.error('❌ Moderation status update error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update moderation status: ' + error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`�� AI backend running on port ${PORT}`)
);
