-- Database Schema for Content Moderation and Notifications
-- REMOVED FOR MERGE - Content moderation system has been removed
-- Run these SQL commands in your Supabase database if you need them later

-- 1. Content Moderation Table (REMOVED FOR MERGE)
-- CREATE TABLE IF NOT EXISTS content_moderation (
--     id SERIAL PRIMARY KEY,
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     content TEXT NOT NULL,
--     content_type VARCHAR(100) NOT NULL,
--     moderation_result JSONB NOT NULL,
--     action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject', 'review')),
--     status VARCHAR(50) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
--     admin_notes TEXT,
--     reviewed_at TIMESTAMP WITH TIME ZONE,
--     reviewed_by UUID REFERENCES auth.users(id),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 2. User Notifications Table (REMOVED FOR MERGE)
-- CREATE TABLE IF NOT EXISTS user_notifications (
--     id SERIAL PRIMARY KEY,
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     type VARCHAR(100) NOT NULL,
--     title VARCHAR(255) NOT NULL,
--     message TEXT NOT NULL,
--     read BOOLEAN DEFAULT FALSE,
--     read_at TIMESTAMP WITH TIME ZONE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- 3. Add indexes for better performance (REMOVED FOR MERGE)
-- CREATE INDEX IF NOT EXISTS idx_content_moderation_user_id ON content_moderation(user_id);
-- CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);
-- CREATE INDEX IF NOT EXISTS idx_content_moderation_created_at ON content_moderation(created_at);
-- CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
-- CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
-- CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
-- CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

-- 4. Add RLS (Row Level Security) policies (REMOVED FOR MERGE)
-- ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Content moderation policies (REMOVED FOR MERGE)
-- CREATE POLICY "Users can view their own moderation records" ON content_moderation
--     FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Admins can view all moderation records" ON content_moderation
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE profiles.id = auth.uid() 
--             AND profiles.role = 'admin'
--         )
--     );

-- User notifications policies (REMOVED FOR MERGE)
-- CREATE POLICY "Users can view their own notifications" ON user_notifications
--     FOR ALL USING (auth.uid() = user_id);

-- 5. Function to update updated_at timestamp (REMOVED FOR MERGE)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- 6. Trigger to automatically update updated_at (REMOVED FOR MERGE)
-- CREATE TRIGGER update_content_moderation_updated_at 
--     BEFORE UPDATE ON content_moderation 
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Sample data for testing (REMOVED FOR MERGE)
-- INSERT INTO content_moderation (user_id, content, content_type, moderation_result, action, status)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
--     'Sample content for testing',
--     'project_description',
--     '{"action": "review", "message": "Content flagged for review", "issues": ["potential sensitive content"]}',
--     'review',
--     'pending_review'
-- );

-- NOTE: This system has been removed for merge. The platform now operates without content moderation.
-- Users can submit content directly without AI review or admin approval.

-- ============================================================================
-- CRITICAL: FIX FOR 406 ERRORS - RLS POLICIES FOR FOLLOWS AND SAVED_PROJECTS
-- ============================================================================

-- Enable RLS on follows table (if not already enabled)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Enable RLS on saved_projects table (if not already enabled)
ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
CREATE POLICY "Users can view follows they're involved in" ON public.follows
    FOR SELECT USING (
        auth.uid() = follower_id OR 
        auth.uid() = following_id
    );

CREATE POLICY "Users can create follows" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for saved_projects table
CREATE POLICY "Users can view their own saved projects" ON public.saved_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save projects" ON public.saved_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved projects" ON public.saved_projects
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- END OF CRITICAL FIX
-- ============================================================================ 