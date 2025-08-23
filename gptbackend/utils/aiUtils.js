// Cache for embeddings to reduce API calls
const embeddingsCache = new Map();

// OpenAI client setup
let openaiClient = null;

async function getOpenAIClient() {
    if (!openaiClient) {
        const OpenAI = (await import('openai')).default;
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

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

// 🔍 Semantic search with embeddings
async function semanticSearch(query, projects, limit = 10) {
    try {
        const queryEmbedding = await generateEmbedding(query);

        const scoredProjects = projects.map(project => {
            let similarity = 0;
            const projectText = [
                project.name || '',
                project.description || '',
                project.category_type || '',
                project.tagline || '',
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

// Generate AI-powered project suggestions
async function generateProjectSuggestions(projectData) {
    try {
        const client = await getOpenAIClient();
        
        const prompt = `Based on this startup project, suggest improvements and next steps:
        
Project: ${projectData.name}
Description: ${projectData.description}
Category: ${projectData.category_type}
Tagline: ${projectData.tagline}

Please provide:
1. 3 specific improvement suggestions
2. 2 potential next steps
3. 1 marketing tip

Format as JSON with keys: improvements, nextSteps, marketingTip`;

        const response = await client.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a startup advisor helping founders improve their projects. Provide practical, actionable advice."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const suggestions = response.choices[0].message.content;
        return suggestions;
    } catch (error) {
        console.error('Error generating suggestions:', error);
        throw new Error('Failed to generate project suggestions');
    }
}

export {
    generateEmbedding,
    cosineSimilarity,
    semanticSearch,
    generateProjectSuggestions,
    getOpenAIClient
};