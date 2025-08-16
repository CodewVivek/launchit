// Script to generate AI embeddings for all existing projects
// This will make AI search actually work with real results

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// Function to generate embedding for a project
async function generateProjectEmbedding(project) {
    try {
        // Create project text for embedding
        const projectText = [
            project.name || '',
            project.description || '',
            project.tagline || '',
            project.category_type || '',
            project.tags ? project.tags.join(' ') : ''
        ].filter(text => text.trim()).join(' ');

        if (!projectText.trim()) {
            console.log(`⚠️  Project ${project.id} has no text content, skipping...`);
            return false;
        }

        // Call your AI backend to generate embedding
        const response = await fetch('http://localhost:3001/api/embeddings/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: project.id,
                projectText: projectText
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Generated embedding for project: ${project.name}`);
            return true;
        } else {
            console.log(`❌ Failed to generate embedding for project: ${project.name}`);
            return false;
        }

    } catch (error) {
        console.error(`❌ Error generating embedding for project ${project.id}:`, error.message);
        return false;
    }
}

// Main function to process all projects
async function generateAllProjectEmbeddings() {
    try {
        console.log('🚀 Starting AI embedding generation for all projects...\n');

        // Fetch all launched projects
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('status', 'launched');

        if (error) {
            throw new Error('Failed to fetch projects: ' + error.message);
        }

        if (!projects || projects.length === 0) {
            console.log('❌ No projects found in database');
            return;
        }

        console.log(`📊 Found ${projects.length} projects to process\n`);

        let successCount = 0;
        let failCount = 0;

        // Process projects in batches to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < projects.length; i += batchSize) {
            const batch = projects.slice(i, i + batchSize);

            console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(projects.length / batchSize)}...`);

            // Process batch concurrently
            const batchResults = await Promise.all(
                batch.map(project => generateProjectEmbedding(project))
            );

            // Count results
            batchResults.forEach(success => {
                if (success) successCount++;
                else failCount++;
            });

            // Small delay between batches to be nice to the API
            if (i + batchSize < projects.length) {
                console.log('⏳ Waiting 2 seconds before next batch...\n');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log('\n🎉 AI Embedding Generation Complete!');
        console.log(`✅ Successfully processed: ${successCount} projects`);
        console.log(`❌ Failed to process: ${failCount} projects`);
        console.log(`📊 Total projects: ${projects.length}`);

        if (successCount > 0) {
            console.log('\n🚀 Your AI search should now work with real results!');
            console.log('💡 Try searching for "odd", "chatgpt", or any project name in your header search.');
        }

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    }
}

// Run the script
generateAllProjectEmbeddings(); 