// Script to check if embedding column exists and provide instructions
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkEmbeddingColumn() {
    try {
        console.log('🔍 Checking if embedding column exists...');

        // Try to fetch a project and see what columns exist
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            console.log('❌ Error fetching project:', error.message);
            return;
        }

        console.log('✅ Project fetched successfully');
        console.log('📊 Available columns:', Object.keys(project));

        if ('embedding' in project) {
            console.log('✅ Embedding column already exists!');
        } else {
            console.log('❌ Embedding column is missing!');
            console.log('\n🚨 ACTION REQUIRED:');
            console.log('1. Go to your Supabase dashboard');
            console.log('2. Open SQL Editor');
            console.log('3. Run this SQL command:');
            console.log('\n   ALTER TABLE projects ADD COLUMN embedding vector(1536);');
            console.log('\n4. Then run: CREATE EXTENSION IF NOT EXISTS vector;');
            console.log('\n5. After that, come back and run the embedding generation script!');
        }

    } catch (error) {
        console.log('❌ Check failed:', error.message);
    }
}

checkEmbeddingColumn(); 