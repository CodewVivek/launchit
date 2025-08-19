// Test script to verify database connectivity and table structure
// Run this in your backend directory to test the database setup

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
    

    try {
        // Test 1: Check if content_moderation table exists
        
        const { data: moderationData, error: moderationError } = await supabase
            .from('content_moderation')
            .select('*')
            .limit(1);

        if (moderationError) {
            
        } else {
            
            
        }

        // Test 2: Check if user_notifications table exists
        
        const { data: notificationsData, error: notificationsError } = await supabase
            .from('user_notifications')
            .select('*')
            .limit(1);

        if (notificationsError) {
            
        } else {
            
            
        }

        // Test 3: Check if profiles table exists and has admin users
        
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .eq('role', 'admin')
            .limit(5);

        if (profilesError) {
            
        } else {
            
            
            profilesData.forEach(profile => {
                 - Role: ${profile.role}`);
            });
        }

        // Test 4: Check table structure
        

        // Get content_moderation table info
        const { data: moderationInfo, error: moderationInfoError } = await supabase
            .rpc('get_table_info', { table_name: 'content_moderation' })
            .catch(() => ({ data: null, error: 'RPC function not available' }));

        if (moderationInfoError) {
            ');
        } else {
            
        }

        

        if (moderationError || notificationsError || profilesError) {
            
            
            
            
            
        } else {
            
        }

    } catch (error) {
        
        
        
        
        
    }
}

// Run the test
testDatabase(); 