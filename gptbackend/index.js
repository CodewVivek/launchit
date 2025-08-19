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
  origin: [
    'https://launchit.site',
    'https://launchitsite.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
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
const MAX_REQUESTS_PER_WINDOW = 50; // 50 requests per 15 minutes (increased for content moderation)

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
app.post('/api/moderate', async (req, res) => {
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

    // Determine action based on moderation level and issues
    let action = 'approve';
    let message = 'Content approved';

    if (moderationResult.moderationLevel === 'flagged') {
      // Check for severe violations that should be rejected
      if (moderationResult.issues.some(issue =>
        issue.includes('Hate speech') ||
        issue.includes('Self-harm') ||
        issue.includes('Violent content')
      )) {
        action = 'reject';
        message = 'Content rejected - violates community guidelines';
      } else {
        // Other flagged content goes to review
        action = 'review';
        message = 'Content flagged for admin review';
      }
    }

    // Check for inappropriate language that should be rejected
    if (moderationResult.issues.some(issue =>
      issue.includes('Inappropriate language detected')
    )) {
      action = 'reject';
      message = 'Content rejected - contains inappropriate language';
    }
    // Additional check for custom issues that might require review
    else if (moderationResult.issues.length > 0 && action === 'approve') {
      action = 'review';
      message = 'Content flagged for review due to potential issues';
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

    // 🔔 SEND NOTIFICATIONS BASED ON MODERATION ACTION
    try {
      if (action === 'review') {
        // 1. Notify user that their content is pending review
        await notifyUserContentPendingReview(userId, contentType, content);

        // 2. Notify all admins about new content requiring review
        await notifyAdminsContentNeedsReview(contentType, content, userId);

      } else if (action === 'reject') {
        // Notify user that their content was rejected
        await notifyUserContentRejected(userId, contentType, content, moderationResult.issues);
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the moderation if notifications fail
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

    console.log(`🔍 Generating embedding for project: ${project.name}`);
    console.log(`📝 Text content: ${textForEmbedding.substring(0, 100)}...`);

    const embedding = await generateEmbedding(textForEmbedding);

    // Update project with embedding
    const { error: updateError } = await supabase
      .from('projects')
      .update({ embedding: embedding })
      .eq('id', projectId);

    if (updateError) {
      throw new Error('Failed to update project: ' + updateError.message);
    }

    console.log(`✅ Successfully generated embedding for project: ${project.name}`);

    res.json({
      success: true,
      message: 'Embedding generated successfully',
      projectId: projectId,
      projectName: project.name
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

// 5. UPDATE MODERATION STATUS (Admin only) - Enhanced with Soft Removal
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

    // First, get the moderation record to understand what content was flagged
    const { data: moderationRecord, error: fetchError } = await supabase
      .from('content_moderation')
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError || !moderationRecord) {
      throw new Error('Moderation record not found');
    }

    // Update moderation status
    const { error: updateError } = await supabase
      .from('content_moderation')
      .update({
        status: action,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin' // TODO: Replace with actual admin user ID
      })
      .eq('id', recordId);

    if (updateError) {
      throw new Error('Failed to update moderation status: ' + updateError.message);
    }

    // 🚨 HARD DELETION: If content is rejected, delete it completely and notify user
    if (action === 'rejected') {
      await handleContentHardDeletion(moderationRecord, adminNotes);
    }

    // ✅ APPROVAL: If content is approved, mark it as approved
    if (action === 'approved') {
      await handleContentApproval(moderationRecord, adminNotes);
    }

    res.json({
      success: true,
      message: `Content ${action} successfully`,
      recordId: recordId,
      action: action,
      contentDeleted: action === 'rejected',
      contentApproved: action === 'approved'
    });

  } catch (error) {
    console.error('❌ Moderation status update error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update moderation status: ' + error.message
    });
  }
});

// 🚨 NEW: Handle hard deletion of rejected content
async function handleContentHardDeletion(moderationRecord, adminNotes) {
  try {
    const { content_type, user_id, content } = moderationRecord;

    // Find the project that contains this flagged content
    let { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user_id);

    if (fetchError || !projects || projects.length === 0) {
      console.warn('No projects found for user:', user_id);
      return;
    }

    // Find the project with matching content
    const targetProject = projects.find(project => {
      switch (content_type) {
        case 'project_name':
          return project.name === content;
        case 'project_tagline':
          return project.tagline === content;
        case 'project_description':
          return project.description === content;
        default:
          return false;
      }
    });

    if (!targetProject) {
      console.warn('No matching project found for content:', content);
      return;
    }

    // 🚨 HARD DELETE: Completely remove the project from database
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', targetProject.id);

    if (deleteError) {
      console.error('Failed to delete project:', deleteError);
    } else {
      console.log(`✅ Project deleted: ${targetProject.id} - ${content_type} rejected`);

      // 🚨 SEND USER NOTIFICATION: Create notification record
      await sendUserNotification(user_id, {
        type: 'content_rejected',
        title: '🚫 Your launch has been deleted',
        message: `Your launch "${targetProject.name}" has been deleted due to inappropriate content.\n\nReason: ${adminNotes || 'Content violates community guidelines'}\n\nPlease relaunch with corrected content.`,
        project_id: targetProject.id,
        project_name: targetProject.name,
        admin_reason: adminNotes || 'Content violates community guidelines'
      });
    }

  } catch (error) {
    console.error('Error in hard deletion:', error);
  }
}

// ✅ NEW: Handle approval of content
async function handleContentApproval(moderationRecord, adminNotes) {
  try {
    const { content_type, user_id, content } = moderationRecord;

    // Find the project that contains this content
    let { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user_id);

    if (fetchError || !projects || projects.length === 0) {
      console.warn('No projects found for user:', user_id);
      return;
    }

    // Find the project with matching content
    const targetProject = projects.find(project => {
      switch (content_type) {
        case 'project_name':
          return project.name === content;
        case 'project_tagline':
          return project.tagline === content;
        case 'project_description':
          return project.description === content;
        default:
          return false;
      }
    });

    if (!targetProject) {
      console.warn('No project found for content:', content);
      return;
    }

    // ✅ APPROVE: Mark content as approved
    const updateData = {
      moderation_status: 'approved',
      moderation_reason: adminNotes || 'Content approved by admin',
      moderation_date: new Date().toISOString(),
      moderation_type: content_type
    };

    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', targetProject.id);

    if (projectUpdateError) {
      console.error('Failed to approve project content:', projectUpdateError);
    } else {
      console.log(`✅ Content approved for project ${targetProject.id}: ${content_type}`);

      // ✅ SEND USER NOTIFICATION: Content approved
      await sendUserNotification(user_id, {
        type: 'content_approved',
        title: '✅ Your launch has been approved',
        message: `Your launch "${targetProject.name}" has been approved by our moderators. It's now visible to the community!`,
        project_id: targetProject.id,
        project_name: targetProject.name
      });
    }

  } catch (error) {
    console.error('Error in content approval:', error);
  }
}

// 🚨 NEW: Send user notifications for moderation actions
async function sendUserNotification(userId, notificationData) {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        project_id: notificationData.project_id,
        project_name: notificationData.project_name,
        admin_reason: notificationData.admin_reason,
        created_at: new Date().toISOString(),
        read: false
      });

    if (error) {
      console.error('Failed to create user notification:', error);
    } else {
      console.log(`✅ User notification sent to ${userId}: ${notificationData.type}`);
    }
  } catch (error) {
    console.error('Error sending user notification:', error);
  }
}

// 🚨 NEW: Notify user when their content is pending review
async function notifyUserContentPendingReview(userId, contentType, content) {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'content_pending_review',
        title: '🔔 Your launch is pending review',
        message: `Your launch "${content}" (type: ${contentType}) is pending review by our moderators. Please check the moderation queue for updates.`,
        created_at: new Date().toISOString(),
        read: false
      });

    if (error) {
      console.error('Failed to send user pending review notification:', error);
    } else {
      console.log(`✅ User pending review notification sent to ${userId}`);
    }
  } catch (error) {
    console.error('Error sending user pending review notification:', error);
  }
}

// 🚨 NEW: Notify all admins about new content requiring review
async function notifyAdminsContentNeedsReview(contentType, content, userId) {
  try {
    const { data: admins, error: fetchAdminsError } = await supabase
      .from('users')
      .select('id, email')
      .eq('is_admin', true);

    if (fetchAdminsError || !admins || admins.length === 0) {
      console.warn('No admin users found to notify.');
      return;
    }

    for (const admin of admins) {
      const { error: notificationError } = await supabase
        .from('user_notifications')
        .insert({
          user_id: admin.id,
          type: 'content_needs_review',
          title: '🔔 New content needs review',
          message: `New content of type "${contentType}" with content "${content}" from user ${userId} is pending review. Please moderate it.`,
          created_at: new Date().toISOString(),
          read: false
        });

      if (notificationError) {
        console.error(`Failed to send admin review notification to ${admin.email}:`, notificationError);
      } else {
        console.log(`✅ Admin review notification sent to ${admin.email}`);
      }
    }
  } catch (error) {
    console.error('Error sending admin review notifications:', error);
  }
}

// 🚨 NEW: Notify user when their content is rejected
async function notifyUserContentRejected(userId, contentType, content, issues) {
  try {
    const rejectionReason = issues && issues.length > 0 ? issues.join(', ') : 'Content violates community guidelines';
    const { error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'content_rejected',
        title: '🚫 Your launch has been rejected',
        message: `Your launch "${content}" (type: ${contentType}) has been rejected by our moderators.\n\nReason: ${rejectionReason}\n\nPlease revise your content and resubmit for review.`,
        created_at: new Date().toISOString(),
        read: false
      });

    if (error) {
      console.error('Failed to send user rejection notification:', error);
    } else {
      console.log(`✅ User rejection notification sent to ${userId}`);
    }
  } catch (error) {
    console.error('Error sending user rejection notification:', error);
  }
}

// 6. GET USER NOTIFICATIONS (User only) - For viewing moderation notifications
app.get('/api/notifications/:userId', rateLimitMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // TODO: Add user authentication check

    // Get user notifications
    const { data: notifications, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      throw new Error('Failed to fetch notifications: ' + error.message);
    }

    res.json({
      success: true,
      notifications: notifications || [],
      total: notifications ? notifications.length : 0
    });

  } catch (error) {
    console.error('❌ Notifications fetch error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch notifications: ' + error.message
    });
  }
});

// 7. MARK NOTIFICATION AS READ (User only)
app.put('/api/notifications/:notificationId/read', rateLimitMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // TODO: Add user authentication check

    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      throw new Error('Failed to mark notification as read: ' + error.message);
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to mark notification as read: ' + error.message
    });
  }
});

// 8. GET ADMIN NOTIFICATIONS (Admin only) - For content review notifications
app.get('/api/admin/notifications', rateLimitMiddleware, async (req, res) => {
  try {
    // TODO: Add admin authentication check

    // Get all admin notifications
    const { data: notifications, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('type', 'content_needs_review')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error('Failed to fetch admin notifications: ' + error.message);
    }

    res.json({
      success: true,
      notifications: notifications || [],
      total: notifications ? notifications.length : 0
    });

  } catch (error) {
    console.error('❌ Admin notifications fetch error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch admin notifications: ' + error.message
    });
  }
});

// 9. GET MODERATION QUEUE WITH NOTIFICATIONS (Admin only)
app.get('/api/admin/moderation/queue', rateLimitMiddleware, async (req, res) => {
  try {
    const { status = 'pending_review', limit = 50 } = req.query;

    // TODO: Add admin authentication check

    // Get moderation queue with user details
    const { data: moderationRecords, error } = await supabase
      .from('content_moderation')
      .select(`
        *,
        profiles:user_id (id, full_name, email, username)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      throw new Error('Failed to fetch moderation queue: ' + error.message);
    }

    // Get unread admin notifications count
    const { count: unreadNotifications } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'content_needs_review')
      .eq('read', false);

    res.json({
      success: true,
      records: moderationRecords || [],
      total: moderationRecords ? moderationRecords.length : 0,
      status: status,
      unreadNotifications: unreadNotifications || 0
    });

  } catch (error) {
    console.error('❌ Admin moderation queue error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch admin moderation queue: ' + error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`🚀 AI backend running on port ${PORT}`)
);
