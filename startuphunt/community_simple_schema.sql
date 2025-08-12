-- Simple Community Database Schema
-- This creates the minimal tables needed for the community system

-- 1. Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Community Replies Table
CREATE TABLE IF NOT EXISTS community_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Community Likes Table
CREATE TABLE IF NOT EXISTS community_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 4. Reports Table (using existing structure, just adding post_id)
-- Note: The existing reports table already has project_id, comment_id, etc.
-- We'll add a post_id column to support community post reporting

-- Add post_id column to existing reports table if it doesn't exist
ALTER TABLE reports ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Posts are viewable by everyone
CREATE POLICY "Posts are viewable by everyone" ON community_posts
    FOR SELECT USING (true);

-- Users can create posts
CREATE POLICY "Users can create posts" ON community_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts" ON community_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts, admins can delete any
CREATE POLICY "Users can delete their own posts" ON community_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Replies are viewable by everyone
CREATE POLICY "Replies are viewable by everyone" ON community_replies
    FOR SELECT USING (true);

-- Users can create replies
CREATE POLICY "Users can create replies" ON community_replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies" ON community_replies
    FOR DELETE USING (auth.uid() = user_id);

-- Likes are viewable by everyone
CREATE POLICY "Likes are viewable by everyone" ON community_likes
    FOR SELECT USING (true);

-- Users can manage their own likes
CREATE POLICY "Users can manage their own likes" ON community_likes
    FOR ALL USING (auth.uid() = user_id);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_replies_post_id ON community_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_user_id ON community_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON community_likes(user_id);

-- Grant permissions
GRANT ALL ON community_posts TO authenticated;
GRANT ALL ON community_replies TO authenticated;
GRANT ALL ON community_likes TO authenticated;
GRANT ALL ON reports TO authenticated; 