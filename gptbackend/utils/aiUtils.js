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
        // Check cache first
        const cacheKey = text.toLowerCase().trim();
        if (embeddingsCache.has(cacheKey)) {
            return embeddingsCache.get(cacheKey);
        }

        const response = await getOpenAIClient().embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });

        const embedding = response.data[0].embedding;

        // Cache the result
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

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

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

// Moderate content using OpenAI
async function moderateContent(content) {
    try {
        // Check cache first
        const cacheKey = content.toLowerCase().trim();
        if (moderationCache.has(cacheKey)) {
            return moderationCache.get(cacheKey);
        }

        const response = await getOpenAIClient().moderations.create({
            input: content,
        });

        const result = response.results[0];

        // Analyze the content for specific issues
        const analysis = {
            flagged: result.flagged,
            categories: result.categories,
            categoryScores: result.categoryScores,
            moderationLevel: 'clean',
            issues: [],
            recommendations: []
        };

        // Determine moderation level and issues
        if (result.flagged) {
            analysis.moderationLevel = 'flagged';

            // Check for specific issues
            if (result.categories.harassment) {
                analysis.issues.push('Potential harassment content');
                analysis.recommendations.push('Review for inappropriate language');
            }

            if (result.categories.hate) {
                analysis.issues.push('Hate speech detected');
                analysis.recommendations.push('Immediate rejection recommended');
            }

            if (result.categories.sexual) {
                analysis.issues.push('Sexual content detected');
                analysis.recommendations.push('Review for appropriateness');
            }

            if (result.categories.violence) {
                analysis.issues.push('Violent content detected');
                analysis.recommendations.push('Review for safety concerns');
            }

            if (result.categories.self_harm) {
                analysis.issues.push('Self-harm content detected');
                analysis.recommendations.push('Immediate rejection recommended');
            }
        } else {
            // Content is clean
            analysis.moderationLevel = 'clean';
        }

        // Additional custom checks
        const customIssues = checkCustomIssues(content);
        analysis.issues.push(...customIssues.issues);
        analysis.recommendations.push(...customIssues.recommendations);

        // Cache the result
        moderationCache.set(cacheKey, analysis);

        return analysis;
    } catch (error) {
        console.error('Error moderating content:', error);
        throw new Error('Failed to moderate content');
    }
}

// Custom content checks
function checkCustomIssues(content) {
    const issues = [];
    const recommendations = [];

    // Check for excessive exclamation marks
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 3) {
        issues.push(`Excessive exclamation marks (${exclamationCount})`);
        recommendations.push('Reduce promotional language');
    }

    // Check for excessive capitalization
    const upperCaseCount = (content.match(/[A-Z]/g) || []).length;
    const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
    if (totalLetters > 0 && (upperCaseCount / totalLetters) > 0.7) {
        issues.push('Excessive capitalization detected');
        recommendations.push('Use normal case formatting');
    }

    // Check for explicit inappropriate words
    const inappropriateWords = [
        'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell',
        'piss', 'cock', 'dick', 'pussy', 'cunt', 'whore',
        'slut', 'bastard', 'motherfucker', 'fucker', 'fucking'
    ];
    const lowerContent = content.toLowerCase();
    const foundInappropriateWords = inappropriateWords.filter(word => lowerContent.includes(word));

    if (foundInappropriateWords.length > 0) {
        issues.push(`Inappropriate language detected: ${foundInappropriateWords.join(', ')}`);
        recommendations.push('Remove inappropriate language to comply with community guidelines');
    }

    // Check for spam indicators
    const spamWords = ['buy now', 'limited time', 'act fast', 'click here', 'amazing results', 'guaranteed success'];
    const foundSpamWords = spamWords.filter(word => lowerContent.includes(word));

    if (foundSpamWords.length > 0) {
        issues.push(`Spam indicators: ${foundSpamWords.join(', ')}`);
        recommendations.push('Remove promotional language');
    }

    // Check for repetitive text
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = {};
    words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const repetitiveWords = Object.entries(wordCounts)
        .filter(([word, count]) => count > 3 && word.length > 3)
        .map(([word, count]) => `${word} (${count}x)`);

    if (repetitiveWords.length > 0) {
        issues.push(`Repetitive words: ${repetitiveWords.join(', ')}`);
        recommendations.push('Reduce repetition in content');
    }

    return { issues, recommendations };
}

// Semantic search function
async function semanticSearch(query, projects, limit = 10) {
    try {
        // Generate embedding for search query
        const queryEmbedding = await generateEmbedding(query);

        // Calculate similarity scores for all projects
        const scoredProjects = projects.map(project => {
            let similarity = 0;

            // Combine multiple text fields for better search
            const projectText = [
                project.title || '',
                project.description || '',
                project.category || '',
                project.tags ? project.tags.join(' ') : ''
            ].join(' ').trim();

            if (projectText && project.embedding) {
                similarity = cosineSimilarity(queryEmbedding, project.embedding);
            }

            return {
                ...project,
                similarity,
                searchScore: similarity
            };
        });

        // Sort by similarity score (highest first)
        scoredProjects.sort((a, b) => b.similarity - a.similarity);

        // Return top results
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