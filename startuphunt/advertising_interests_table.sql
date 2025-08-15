-- Create advertising_interests table for storing user advertising submissions
CREATE TABLE IF NOT EXISTS public.advertising_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id INTEGER REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    project_name TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    plan_price TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    additional_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_advertising_interests_user_id ON public.advertising_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_advertising_interests_project_id ON public.advertising_interests(project_id);
CREATE INDEX IF NOT EXISTS idx_advertising_interests_status ON public.advertising_interests(status);
CREATE INDEX IF NOT EXISTS idx_advertising_interests_created_at ON public.advertising_interests(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.advertising_interests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own interests
CREATE POLICY "Users can view own advertising interests" ON public.advertising_interests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own interests
CREATE POLICY "Users can insert own advertising interests" ON public.advertising_interests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own interests
CREATE POLICY "Users can update own advertising interests" ON public.advertising_interests
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all interests
CREATE POLICY "Admins can view all advertising interests" ON public.advertising_interests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Admins can update all interests
CREATE POLICY "Admins can update all advertising interests" ON public.advertising_interests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_advertising_interests_updated_at 
    BEFORE UPDATE ON public.advertising_interests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO public.advertising_interests (
--     user_id,
--     project_id,
--     project_name,
--     plan_id,
--     plan_name,
--     plan_price,
--     user_name,
--     user_email,
--     user_phone,
--     additional_info,
--     status
-- ) VALUES (
--     'sample-user-id',
--     1,
--     'Sample Project',
--     '1day',
--     '1 Day',
--     '₹199',
--     'John Doe',
--     'john@example.com',
--     '+1234567890',
--     'Interested in promoting my startup',
--     'pending'
-- ); 