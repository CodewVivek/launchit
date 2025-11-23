import express from "express";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
// fetch is built-in to Node.js 18+
import cors from "cors";
import { semanticSearch, generateEmbedding } from "./utils/aiUtils.js";

dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    'https://launchit.site',
    'https://launchitsite.netlify.app'
  ],
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
const MAX_REQUESTS_PER_WINDOW = 50; // 50 requests per 15 minutes

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

// Fast HTML logo extraction (no API calls, instant)
function extractLogoFromHTML(html, microlinkData) {
  // Try Microlink metadata first (if available)
  if (microlinkData?.logo_url) return microlinkData.logo_url;
  if (microlinkData?.og_image) return microlinkData.og_image;

  // Extract from HTML meta tags (instant, no API)
  const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) return ogImage;

  const twitterImage = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1];
  if (twitterImage) return twitterImage;

  // Try apple-touch-icon
  const appleTouchIcon = html.match(/<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i)?.[1];
  if (appleTouchIcon) return appleTouchIcon;

  return null;
}

// Fast metadata-only function (no screenshot - saves 3-5s)
async function generateMicrolinkMetadata(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const metadataResponse = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const metadataData = await metadataResponse.json();

    return {
      logo_url: metadataData.data?.logo?.url || metadataData.data?.image?.url || null,
      og_image: metadataData.data?.image?.url || null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Microlink metadata timeout');
    }
    return { logo_url: null, og_image: null };
  }
}

// Background screenshot generation (optional, non-blocking)
async function generateScreenshotInBackground(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for background

    const response = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&width=1200&height=675&format=png&meta=false`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const data = await response.json();
    return data.data?.screenshot?.url || null;
  } catch (error) {
    // Silent fail - screenshot is optional
    return null;
  }
}

app.post("/generatelaunchdata", rateLimitMiddleware, async (req, res) => {
  const { url, user_id } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  try {
    // STEP 1: Fetch HTML and Microlink metadata in parallel (0-2s)
    const htmlController = new AbortController();
    const htmlTimeoutId = setTimeout(() => htmlController.abort(), 2000);

    const [htmlResponse, microlinkMetadata] = await Promise.all([
      fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: htmlController.signal
      }).then(r => {
        clearTimeout(htmlTimeoutId);
        return r.text();
      }).catch(() => {
        clearTimeout(htmlTimeoutId);
        return "";
      }),
      generateMicrolinkMetadata(url) // Fast, metadata only (no screenshot)
    ]);

    const html = htmlResponse;

    // STEP 2: Extract logo from HTML (instant, no API)
    const logoUrl = extractLogoFromHTML(html, microlinkMetadata);

    // Extract Open Graph image for thumbnail
    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] || microlinkMetadata.og_image;

    // STEP 3: Optimized OpenAI prompt (shorter = faster)
    const prompt = `Extract JSON only:
{
  "name": "company/product name",
  "tagline": "short tagline",
  "description": "2-3 sentences",
  "category": "category",
  "features": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "social_links": [],
  "other_links": []
}
HTML: ${html.slice(0, 4000)}`; // Reduced from 7000

    // Call OpenAI (1-3s)
    let gptresponse;
    try {
      gptresponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 400 // Limit for speed
      });
    } catch (openaiError) {
      // OpenAI API error occurred
      return res.status(500).json({
        err: true,
        message: "OpenAI API failed: " + openaiError.message
      });
    }

    // Parse result
    let result;
    try {
      const rawContent = gptresponse.choices[0].message.content.trim();
      const jsonContent = rawContent.replace(/```json\s*|\s*```/g, '').trim();
      result = JSON.parse(jsonContent);
    } catch (e) {
      // Fallback: create basic data from URL
      result = {
        name: url.replace(/https?:\/\/(www\.)?/, '').split('/')[0].replace(/\./g, ' ').toUpperCase(),
        tagline: "Innovative solution for modern needs",
        description: "This product offers cutting-edge features designed to solve real-world problems.",
        category: "startup ecosystem",
        features: ["User-friendly", "Scalable", "Secure"],
        social_links: [],
        other_links: []
      };
    }

    // Return FAST (2-3s total)
    const responseData = {
      name: result.name || "",
      website_url: url,
      tagline: result.tagline || "",
      description: result.description || "",
      category: result.category || "",
      links: [...(result.social_links || []), ...(result.other_links || [])],
      features: result.features || [],
      logo_url: logoUrl,
      thumbnail_url: ogImage, // Use OG image, generate screenshot in background
      success: true
    };

    res.json(responseData);

    // Generate screenshot in background (optional, don't block)
    generateScreenshotInBackground(url).then(screenshotUrl => {
      // Could store in cache/DB and update via WebSocket if needed
      // Or just use OG image which is usually good enough
    }).catch(() => { });

  } catch (err) {
    console.error("Generate launch data error:", err);
    res.status(500).json({ error: true, message: err.message });
  }
});

// ==================== AI FEATURES ENDPOINTS ====================

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
            // Silently continue if embedding generation fails
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
    // Semantic search error occurred
    res.status(500).json({
      error: true,
      message: 'Semantic search failed: ' + error.message
    });
  }
});

// 3. GENERATE EMBEDDINGS FOR EXISTING PROJECTS
app.post('/api/embeddings/generate', rateLimitMiddleware, async (req, res) => {
  try {
    const { projectId, projectText } = req.body;

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

    // Use provided projectText or generate from project data
    let textForEmbedding = projectText;
    if (!textForEmbedding) {
      textForEmbedding = [
        project.name || '',
        project.description || '',
        project.tagline || '',
        project.category_type || '',
        project.tags ? project.tags.join(' ') : ''
      ].filter(text => text.trim()).join(' ').trim();
    }

    if (!textForEmbedding) {
      return res.status(400).json({
        error: true,
        message: 'Project has no text content for embedding'
      });
    }

    const embedding = await generateEmbedding(textForEmbedding);

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
      projectId: projectId,
      projectName: project.name
    });

  } catch (error) {
    // Embedding generation error occurred
    res.status(500).json({
      error: true,
      message: 'Embedding generation failed: ' + error.message
    });
  }
});

// 4. GET MODERATION QUEUE (Admin only) - REMOVED FOR MERGE
// app.get('/api/moderation/queue', rateLimitMiddleware, async (req, res) => { ... });

// 5. UPDATE MODERATION STATUS (Admin only) - REMOVED FOR MERGE  
// app.put('/api/moderation/status', rateLimitMiddleware, async (req, res) => { ... });

// 6. GET USER NOTIFICATIONS (User only) - REMOVED FOR MERGE
// app.get('/api/notifications/:userId', rateLimitMiddleware, async (req, res) => { ... });

// 7. MARK NOTIFICATION AS READ (User only) - REMOVED FOR MERGE
// app.put('/api/notifications/:notificationId/read', rateLimitMiddleware, async (req, res) => { ... });

// 8. GET ADMIN NOTIFICATIONS (Admin only) - REMOVED FOR MERGE
// app.get('/api/admin/notifications', rateLimitMiddleware, async (req, res) => { ... });

// 9. GET MODERATION QUEUE WITH NOTIFICATIONS (Admin only) - REMOVED FOR MERGE
// app.get('/api/admin/moderation/queue', rateLimitMiddleware, async (req, res) => { ... });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'launchit-ai-backend'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    error: true,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  // Server started successfully
}); 