-- Database Schema for AI Features
-- Run this in your Supabase SQL editor

-- 1. Add embedding column to existing projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 2. Create content_moderation table
CREATE TABLE IF NOT EXISTS content_moderation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'project_description', 'comment', 'profile_bio', etc.
  moderation_result JSONB NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'approve', 'reject', 'review'
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review', -- 'approved', 'rejected', 'pending_review'
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_moderation_user_id ON content_moderation(user_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_created_at ON content_moderation(created_at);
CREATE INDEX IF NOT EXISTS idx_content_moderation_content_type ON content_moderation(content_type);

-- 4. Create vector index for embeddings (if using pgvector extension)
-- Note: This requires the pgvector extension to be enabled in Supabase
-- CREATE INDEX IF NOT EXISTS idx_projects_embedding ON projects USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create trigger for updated_at
CREATE TRIGGER update_content_moderation_updated_at 
    BEFORE UPDATE ON content_moderation 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- Users can view their own moderation records
CREATE POLICY "Users can view own moderation records" ON content_moderation
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own moderation records
CREATE POLICY "Users can insert own moderation records" ON content_moderation
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all moderation records
CREATE POLICY "Admins can view all moderation records" ON content_moderation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update moderation records
CREATE POLICY "Admins can update moderation records" ON content_moderation
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 9. Grant necessary permissions
GRANT ALL ON content_moderation TO authenticated;
GRANT ALL ON content_moderation TO service_role;

-- 10. Create view for admin moderation dashboard
CREATE OR REPLACE VIEW admin_moderation_dashboard AS
SELECT 
    cm.id,
    cm.content,
    cm.content_type,
    cm.moderation_result,
    cm.action,
    cm.status,
    cm.admin_notes,
    cm.created_at,
    cm.reviewed_at,
    up.username,
    up.email,
    up.avatar_url
FROM content_moderation cm
JOIN user_profiles up ON cm.user_id = up.user_id
ORDER BY cm.created_at DESC;

-- 11. Grant access to the view
GRANT SELECT ON admin_moderation_dashboard TO authenticated;
GRANT SELECT ON admin_moderation_dashboard TO service_role; 