import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openai = null;

function getOpenAIClient() {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
}

// Cache for embeddings to reduce API calls
const embeddingsCache = new Map();
const moderationCache = new Map();

// Generate embeddings for text
async function generateEmbedding(text) {
    try {
        const cacheKey = text.toLowerCase().trim();
        if (embeddingsCache.has(cacheKey)) {
            return embeddingsCache.get(cacheKey);
        }

        const response = await getOpenAIClient().embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });

        const embedding = response.data[0].embedding;

        embeddingsCache.set(cacheKey, embedding);
        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }

    let dotProduct = 0, normA = 0, normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
}

// 🔎 Moderate content using OpenAI
async function moderateContent(content) {
    try {
        const cacheKey = content.toLowerCase().trim();
        if (moderationCache.has(cacheKey)) {
            return moderationCache.get(cacheKey);
        }

        const response = await getOpenAIClient().moderations.create({
            model: "omni-moderation-latest", // safer model
            input: content,
        });

        const result = response.results[0];

        let action = 'approve';
        let message = 'Content is clean ✅';

        // 🚫 Hard reject categories
        if (result.categories.hate ||
            result.categories.self_harm ||
            result.categories.violence ||
            result.categories.sexual) {
            action = 'reject';
            message = '❌ Contains harmful content (hate, self-harm, violence, or sexual)';
        }
        // ⚠️ Review categories (finance, politics, spam, etc.)
        else if (result.flagged) {
            action = 'review';
            message = '⚠️ Content flagged for review (may contain sensitive/financial/political context)';
        }

        // Additional custom checks (optional)
        const customIssues = checkCustomIssues(content);
        if (customIssues.issues.length > 0) {
            action = action === 'approve' ? 'review' : action;
            message += ` | Issues: ${customIssues.issues.join(', ')}`;
        }

        const analysis = {
            action,
            message,
            categories: result.categories,
            categoryScores: result.category_scores,
            issues: customIssues.issues,
            recommendations: customIssues.recommendations
        };

        moderationCache.set(cacheKey, analysis);
        return analysis;

    } catch (error) {
        console.error('Error moderating content:', error);
        // fallback → allow submission but log
        return { action: 'approve', message: 'Moderation failed, allowing submission' };
    }
}

// 🛠️ Custom content checks
function checkCustomIssues(content) {
    const issues = [];
    const recommendations = [];

    // Excessive exclamation marks
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 3) {
        issues.push(`Too many exclamation marks (${exclamationCount})`);
        recommendations.push('Reduce promotional style');
    }

    // Excessive capitalization
    const upperCaseCount = (content.match(/[A-Z]/g) || []).length;
    const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
    if (totalLetters > 0 && (upperCaseCount / totalLetters) > 0.7) {
        issues.push('Excessive capitalization');
        recommendations.push('Use normal case formatting');
    }

    // Inappropriate words (basic filter)
    const inappropriateWords = [
        'fuck', 'shit', 'bitch', 'ass', 'cunt', 'whore', 'slut', 'bastard', 'motherfucker', 'fucker'
    ];
    const lowerContent = content.toLowerCase();
    const foundBadWords = inappropriateWords.filter(word => lowerContent.includes(word));
    if (foundBadWords.length > 0) {
        issues.push(`Inappropriate language: ${foundBadWords.join(', ')}`);
        recommendations.push('Remove profanity to comply with guidelines');
    }

    // Spam indicators
    const spamWords = ['buy now', 'limited time', 'act fast', 'click here', 'guaranteed success'];
    const foundSpam = spamWords.filter(word => lowerContent.includes(word));
    if (foundSpam.length > 0) {
        issues.push(`Possible spam: ${foundSpam.join(', ')}`);
        recommendations.push('Avoid promotional/spammy phrases');
    }

    return { issues, recommendations };
}

// 🔍 Semantic search with embeddings
async function semanticSearch(query, projects, limit = 10) {
    try {
        const queryEmbedding = await generateEmbedding(query);

        const scoredProjects = projects.map(project => {
            let similarity = 0;
            const projectText = [
                project.title || '',
                project.description || '',
                project.category || '',
                project.tags ? project.tags.join(' ') : ''
            ].join(' ').trim();

            if (projectText && project.embedding) {
                similarity = cosineSimilarity(queryEmbedding, project.embedding);
            }

            return { ...project, similarity, searchScore: similarity };
        });

        scoredProjects.sort((a, b) => b.similarity - a.similarity);
        return scoredProjects.slice(0, limit);

    } catch (error) {
        console.error('Error in semantic search:', error);
        throw new Error('Semantic search failed');
    }
}

export {
    generateEmbedding,
    cosineSimilarity,
    moderateContent,
    semanticSearch,
    checkCustomIssues
};
