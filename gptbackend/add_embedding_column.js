// Script to add the missing embedding column to projects table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function addEmbeddingColumn() {
    try {
        console.log('🔧 Adding embedding column to projects table...');

        // Try to add the embedding column
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS embedding vector(1536);
      `
        });

        if (error) {
            console.log('❌ Error adding column:', error.message);
            console.log('\n💡 You need to manually add this column in Supabase SQL Editor:');
            console.log('   ALTER TABLE projects ADD COLUMN IF NOT EXISTS embedding vector(1536);');
            return;
        }

        console.log('✅ Embedding column added successfully!');

    } catch (error) {
        console.log('❌ Failed to add column:', error.message);
        console.log('\n💡 You need to manually add this column in Supabase SQL Editor:');
        console.log('   ALTER TABLE projects ADD COLUMN IF NOT EXISTS embedding vector(1536);');
    }
}

addEmbeddingColumn(); 