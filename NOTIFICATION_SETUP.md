# 🔔 Content Moderation Notification System Setup

## Overview
This system automatically notifies users and admins when content is flagged for review, ensuring proper content moderation for sensitive topics like sexual health education.

## 🚀 What's New

### 1. **User Notifications**
- Users get notified when their content is pending review
- Users get notified when their content is rejected with reasons
- Toast message: "🚀 Your launch is live but will be reviewed by our team shortly!"

### 2. **Admin Notifications**
- Admins get notified when new content needs review
- Admin dashboard shows moderation queue with notification counts
- New "Moderation" tab in admin dashboard

### 3. **Automatic Content Flagging**
- Sexual health education content is automatically flagged for review
- Content with sensitive topics goes to admin moderation queue
- AI moderation with human oversight

## 🗄️ Database Setup

### Step 1: Run the SQL Schema
```bash
# Copy the contents of database_schema.sql and run in your Supabase SQL editor
```

### Step 2: Verify Tables Created
- `content_moderation` - Stores all moderation records
- `user_notifications` - Stores user and admin notifications

## 🔧 Backend Setup

### Step 1: Update Backend
The backend (`gptbackend/index.js`) now includes:
- Automatic notification sending when content is flagged
- Admin notification endpoints
- User notification endpoints

### Step 2: Restart Backend
```bash
cd gptbackend
npm start
```

## 🎨 Frontend Setup

### Step 1: Updated Components
- `ContentModeration.jsx` - Shows user-friendly review messages
- `AdminDashboard.jsx` - New moderation tab and queue
- `aiApi.js` - New notification API functions

### Step 2: Test the System
1. Submit content with sexual health terms
2. Check admin dashboard for new moderation tab
3. Verify user gets "pending review" message

## 📱 How It Works

### Content Submission Flow
```
1. User submits content
2. AI moderation checks content
3. If flagged for review:
   ✅ User gets: "Launch is live but will be reviewed"
   🔔 Admin gets: "New content needs review"
4. Content goes to admin moderation queue
5. Admin approves/rejects content
6. User gets final notification
```

### Admin Workflow
```
1. Admin sees notification count in dashboard
2. Clicks "Moderation" tab
3. Views pending content with user details
4. Approves/rejects with notes
5. System automatically notifies user
```

## 🎯 Content Types That Get Flagged

### Automatic Review Required
- Sexual health education content
- Reproductive health discussions
- Teen health resources
- Gender identity topics
- Consent education

### Examples
```
✅ "Our platform helps teenagers with sexual health education"
✅ "Providing resources on safe practices and reproductive health"
✅ "Discussing consent and gender identity to empower young people"
```

## 🔍 Testing the System

### Test 1: Submit Sensitive Content
1. Go to pitch upload or project creation
2. Use terms like "sexual health education"
3. Submit content
4. Verify you get the pending review message

### Test 2: Admin Review
1. Login as admin
2. Check admin dashboard
3. Look for new "Moderation" tab
4. Verify content appears in queue

### Test 3: Approve/Reject
1. In moderation queue, click approve/reject
2. Verify user gets notification
3. Check content status updates

## 🚨 Troubleshooting

### Common Issues

#### 1. Notifications Not Sending
- Check backend logs for errors
- Verify database tables exist
- Check Supabase RLS policies

#### 2. Admin Dashboard Not Loading
- Verify admin role in profiles table
- Check browser console for errors
- Verify API endpoints are accessible

#### 3. Content Not Flagged
- Check AI moderation settings
- Verify content contains flagged terms
- Check backend moderation logic

### Debug Commands
```bash
# Check backend logs
cd gptbackend && npm start

# Check database
# Go to Supabase dashboard > SQL Editor
SELECT * FROM content_moderation ORDER BY created_at DESC LIMIT 5;
SELECT * FROM user_notifications ORDER BY created_at DESC LIMIT 5;
```

## 🔐 Security Notes

### Row Level Security (RLS)
- Users can only see their own content and notifications
- Admins can see all content and notifications
- Content moderation records are protected

### Admin Access
- Only users with `role = 'admin'` in profiles table
- Admin endpoints require authentication
- All admin actions are logged

## 📈 Monitoring

### Key Metrics to Watch
- Content flagged for review count
- Average review time
- Rejection rate by content type
- User notification delivery rate

### Dashboard Views
- Admin: Moderation queue with counts
- User: Personal notification history
- System: Overall moderation statistics

## 🎉 Success Indicators

✅ Users see "pending review" message when submitting sensitive content
✅ Admins receive notifications about new content needing review
✅ Admin dashboard shows moderation queue with user details
✅ Content status updates properly (pending → approved/rejected)
✅ Users receive final approval/rejection notifications

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Verify database schema is correct
3. Check backend logs for API errors
4. Ensure all tables and policies are created
5. Verify admin role is set correctly

---

**Remember**: This system ensures that sensitive content like sexual health education gets proper human review while keeping users informed about the status of their submissions. 