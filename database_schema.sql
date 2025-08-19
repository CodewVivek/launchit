-- Database Schema for Content Moderation and Notifications
-- Run these SQL commands in your Supabase database

-- 1. Content Moderation Table (if not already exists)
CREATE TABLE IF NOT EXISTS content_moderation (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    moderation_result JSONB NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject', 'review')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Notifications Table (if not already exists)
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_moderation_user_id ON content_moderation(user_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_created_at ON content_moderation(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

-- 4. Add RLS (Row Level Security) policies
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Content moderation policies
CREATE POLICY "Users can view their own moderation records" ON content_moderation
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all moderation records" ON content_moderation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- User notifications policies
CREATE POLICY "Users can view their own notifications" ON user_notifications
    FOR ALL USING (auth.uid() = user_id);

-- 5. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger to automatically update updated_at
CREATE TRIGGER update_content_moderation_updated_at 
    BEFORE UPDATE ON content_moderation 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Sample data for testing (optional)
-- INSERT INTO content_moderation (user_id, content, content_type, moderation_result, action, status)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
--     'Sample content for testing',
--     'project_description',
--     '{"action": "review", "message": "Content flagged for review", "issues": ["potential sensitive content"]}',
--     'review',
--     'pending_review'
-- ); 