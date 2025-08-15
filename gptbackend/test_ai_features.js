// Test script for AI features
import { moderateContent, generateEmbedding, semanticSearch } from './utils/aiUtils.js';

// Mock data for testing
const testContent = {
    clean: "LaunchIT is a platform for startup discovery and networking. Built with modern web technologies, it offers intuitive project management and community engagement tools.",
    spam: "LaunchIT is AMAZING!!! You have to try this NOW! It will change your life forever and make you successful beyond your wildest dreams! Don't wait, act fast!",
    inappropriate: "This is a test of inappropriate content that should be flagged for review.",
    empty: ""
};

const testProjects = [
    {
        id: 1,
        title: "LaunchIT Platform",
        description: "A comprehensive platform for startup discovery and networking",
        category: "startup ecosystem",
        tags: ["startup", "networking", "platform"],
        embedding: null
    },
    {
        id: 2,
        title: "AI Content Generator",
        description: "An AI-powered tool for creating engaging content automatically",
        category: "ai",
        tags: ["ai", "content", "automation"],
        embedding: null
    }
];

async function testContentModeration() {
    console.log('🧪 Testing Content Moderation...\n');

    try {
        // Test clean content
        console.log('1. Testing clean content:');
        const cleanResult = await moderateContent(testContent.clean);
        console.log('   Result:', cleanResult.action);
        console.log('   Issues:', cleanResult.moderationResult.issues.length);
        console.log('');

        // Test spam content
        console.log('2. Testing spam content:');
        const spamResult = await moderateContent(testContent.spam);
        console.log('   Result:', spamResult.action);
        console.log('   Issues:', spamResult.moderationResult.issues.length);
        console.log('   Issues found:', spamResult.moderationResult.issues);
        console.log('');

        // Test inappropriate content
        console.log('3. Testing inappropriate content:');
        const inappropriateResult = await moderateContent(testContent.inappropriate);
        console.log('   Result:', inappropriateResult.action);
        console.log('   Issues:', inappropriateResult.moderationResult.issues.length);
        console.log('');

    } catch (error) {
        console.error('❌ Content moderation test failed:', error.message);
    }
}

async function testEmbeddingGeneration() {
    console.log('🧪 Testing Embedding Generation...\n');

    try {
        const text = "LaunchIT platform for startups";
        console.log('Generating embedding for:', text);

        const embedding = await generateEmbedding(text);
        console.log('✅ Embedding generated successfully');
        console.log('   Length:', embedding.length);
        console.log('   Sample values:', embedding.slice(0, 5));
        console.log('');

    } catch (error) {
        console.error('❌ Embedding generation test failed:', error.message);
    }
}

async function testSemanticSearch() {
    console.log('🧪 Testing Semantic Search...\n');

    try {
        const query = "startup networking platform";
        console.log('Searching for:', query);

        // First generate embeddings for test projects
        const projectsWithEmbeddings = await Promise.all(
            testProjects.map(async (project) => {
                const projectText = [
                    project.title,
                    project.description,
                    project.category,
                    project.tags.join(' ')
                ].join(' ').trim();

                const embedding = await generateEmbedding(projectText);
                return { ...project, embedding };
            })
        );

        console.log('✅ Generated embeddings for', projectsWithEmbeddings.length, 'projects');

        // Perform semantic search
        const searchResults = await semanticSearch(query, projectsWithEmbeddings, 5);
        console.log('✅ Semantic search completed');
        console.log('   Results found:', searchResults.length);
        console.log('   Top result:', searchResults[0]?.title);
        console.log('   Similarity score:', searchResults[0]?.similarity?.toFixed(4));
        console.log('');

    } catch (error) {
        console.error('❌ Semantic search test failed:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting AI Features Test Suite\n');
    console.log('=====================================\n');

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY environment variable not set');
        console.log('Please set your OpenAI API key before running tests');
        return;
    }

    try {
        await testContentModeration();
        await testEmbeddingGeneration();
        await testSemanticSearch();

        console.log('🎉 All tests completed successfully!');
        console.log('Your AI features are working correctly.');

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  testContentModeration,
  testEmbeddingGeneration,
  testSemanticSearch,
  runAllTests
}; 