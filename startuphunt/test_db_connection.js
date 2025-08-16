// Simple database connection test
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testConnection() {
    try {
        console.log('🔍 Testing database connection...');

        // Try to fetch projects count
        const { count, error } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log('❌ Database error:', error.message);
            return;
        }

        console.log(`✅ Database connected! Found ${count} projects`);

        // Try to fetch one project to see structure
        const { data: sampleProject, error: fetchError } = await supabase
            .from('projects')
            .select('id, name, status')
            .limit(1)
            .single();

        if (fetchError) {
            console.log('❌ Fetch error:', fetchError.message);
        } else if (sampleProject) {
            console.log('✅ Sample project found:', {
                id: sampleProject.id,
                name: sampleProject.name,
                status: sampleProject.status
            });
        }

    } catch (error) {
        console.log('❌ Connection failed:', error.message);
    }
}

testConnection(); 