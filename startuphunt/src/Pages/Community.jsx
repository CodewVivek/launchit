import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Plus,
    Heart,
    Reply,
    Share2,
    Flag,
    Trash2,
    User,
    Clock,
    MoreVertical,
    Globe,
    X,
    List,
    Bold,
    Italic,
    Link,
    Code,
    Quote,
    MoreHorizontal,
    BarChart2,
    ListOrdered
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Snackbar, Alert } from '@mui/material';

const Community = () => {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostBody, setNewPostBody] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('general');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('success');
    const [isOrderedListActive, setIsOrderedListActive] = useState(false);
    const [isUnorderedListActive, setIsUnorderedListActive] = useState(false);
    const [listItemCounter, setListItemCounter] = useState(1);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [showPreview, setShowPreview] = useState(false);
    const [showNewPostDialog, setShowNewPostDialog] = useState(false);

    const bodyInputRef = useRef(null);

    useEffect(() => {
        checkUser();
        fetchPosts();
    }, []);

    // Keyboard shortcuts for formatting
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        formatText('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        formatText('italic');
                        break;
                    case 'k':
                        e.preventDefault();
                        formatText('link');
                        break;
                    case 'q':
                        e.preventDefault();
                        formatText('quote');
                        break;
                    case '`':
                        e.preventDefault();
                        formatText('code');
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleAlert = (message, severity) => {
        setAlertMessage(message);
        setAlertSeverity(severity);
        setAlertOpen(true);
    };

    const handleAlertClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setAlertOpen(false);
    };

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                checkAdminStatus(user.id);
            }
        } catch (error) {
            console.error('Error checking user:', error);
            handleAlert('Failed to check user status.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const checkAdminStatus = async (userId) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (!error && profile?.role === 'admin') {
                setIsAdmin(true);
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            handleAlert('Failed to check admin status.', 'error');
        }
    };

    const fetchPosts = async () => {
        try {
            // First check if the table exists
            const { data: tableCheck, error: tableError } = await supabase
                .from('community_posts')
                .select('id')
                .limit(1);

            if (tableError) {
                console.error('Table does not exist or error:', tableError);
                handleAlert('Community database not set up yet. Please run the SQL schema first.', 'warning');
                setPosts([]);
                return;
            }

            const { data, error } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    community_likes(user_id),
                    community_replies(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const processedPosts = data?.map(post => {
                const likeCount = post.community_likes?.length || 0;
                const replyCount = post.community_replies?.[0]?.count || 0;
                const isLiked = post.community_likes?.some(like => like.user_id === user?.id) || false;
                const canDelete = user?.id === post.user_id || isAdmin;

                // Get user display name - try to get from current user if it's their post
                let displayName = 'Anonymous';
                let userEmail = '';

                if (post.user_id === user?.id) {
                    displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';
                    userEmail = user?.email || '';
                } else {
                    // For other users, show a friendly name
                    displayName = `User ${post.user_id?.slice(0, 4)}`;
                }

                return {
                    ...post,
                    likeCount,
                    replyCount,
                    isLiked,
                    canDelete,
                    userInfo: {
                        username: displayName,
                        full_name: displayName,
                        avatar_url: null,
                        email: userEmail
                    }
                };
            }) || [];

            setPosts(processedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (error.code === '42P01') {
                handleAlert('Community database not set up yet. Please run the SQL schema first.', 'warning');
            } else {
                handleAlert('Failed to fetch posts. Please try again.', 'error');
            }
            setPosts([]);
        }
    };

    const handleNewPost = async () => {
        if (!user) {
            handleAlert('Please login to post', 'warning');
            return;
        }

        if (!newPostTitle.trim() || !newPostBody.trim()) {
            handleAlert('Please fill in both title and body', 'warning');
            return;
        }

        try {
            const { error } = await supabase
                .from('community_posts')
                .insert([{
                    title: newPostTitle.trim(),
                    content: newPostBody.trim(),
                    category: selectedCategory,
                    user_id: user.id
                }]);

            if (error) throw error;

            setNewPostTitle('');
            setNewPostBody('');
            setSelectedCategory('general');
            fetchPosts();
            handleAlert('Post created successfully!', 'success');

        } catch (error) {
            console.error('Error creating post:', error);
            handleAlert('Failed to create post. Please try again.', 'error');
        }
    };

    const handleLike = async (postId) => {
        if (!user) {
            handleAlert('Please login to like posts', 'warning');
            return;
        }

        try {
            const post = posts.find(p => p.id === postId);
            const isLiked = post.isLiked;

            if (isLiked) {
                await supabase
                    .from('community_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('community_likes')
                    .insert({
                        post_id: postId,
                        user_id: user.id
                    });
            }

            fetchPosts();

        } catch (error) {
            console.error('Error handling like:', error);
            handleAlert('Failed to handle like. Please try again.', 'error');
        }
    };

    const handleReply = async (postId) => {
        if (!user) {
            handleAlert('Please login to reply', 'warning');
            return;
        }

        if (!replyContent.trim()) {
            handleAlert('Please write a reply', 'warning');
            return;
        }

        try {
            const { error } = await supabase
                .from('community_replies')
                .insert([{
                    post_id: postId,
                    user_id: user.id,
                    content: replyContent.trim()
                }]);

            if (error) throw error;

            setReplyContent('');
            setReplyingTo(null);
            fetchPosts();
            handleAlert('Reply posted successfully!', 'success');

        } catch (error) {
            console.error('Error creating reply:', error);
            handleAlert('Failed to create reply. Please try again.', 'error');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!user) return;

        const post = posts.find(p => p.id === postId);
        if (!post.canDelete) {
            handleAlert('You can only delete your own posts', 'warning');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            await supabase
                .from('community_likes')
                .delete()
                .eq('post_id', postId);

            await supabase
                .from('community_replies')
                .delete()
                .eq('post_id', postId);

            const { error } = await supabase
                .from('community_posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            fetchPosts();
            handleAlert('Post deleted successfully', 'success');

        } catch (error) {
            console.error('Error deleting post:', error);
            handleAlert('Failed to delete post. Please try again.', 'error');
        }
    };

    const handleReport = async (postId) => {
        if (!user) {
            handleAlert('Please login to report posts', 'warning');
            return;
        }

        const reason = window.prompt('Please provide a reason for reporting this post:');
        if (!reason) return;

        try {
            const { error } = await supabase
                .from('reports')
                .insert([{
                    post_id: postId,
                    user_id: user.id,
                    reason: reason,
                    description: `Reported post: ${postId}`
                }]);

            if (error) throw error;

            handleAlert('Post reported successfully. Thank you for helping keep our community safe.', 'success');

        } catch (error) {
            console.error('Error reporting post:', error);
            handleAlert('Failed to report post. Please try again.', 'error');
        }
    };

    // Text formatting functions
    const formatText = (formatType) => {
        const textarea = bodyInputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let newText = '';

        switch (formatType) {
            case 'bold':
                newText = `**${selectedText}**`;
                break;
            case 'italic':
                newText = `*${selectedText}*`;
                break;
            case 'code':
                newText = `\`${selectedText}\``;
                break;
            case 'link':
                const url = window.prompt('Enter URL:');
                if (url) {
                    newText = `[${selectedText}](${url})`;
                } else {
                    return;
                }
                break;
            case 'quote':
                newText = `> ${selectedText}`;
                break;
            default:
                return;
        }

        const updatedText = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        setNewPostBody(updatedText);

        setTimeout(() => {
            const newCursorPosition = start + newText.length;
            textarea.selectionStart = newCursorPosition;
            textarea.selectionEnd = newCursorPosition;
            textarea.focus();
        }, 0);
    };

    // List functions
    const toggleOrderedList = () => {
        const textarea = bodyInputRef.current;
        if (!textarea) return;
        const isCurrentlyActive = isOrderedListActive;

        setIsOrderedListActive(!isCurrentlyActive);
        setIsUnorderedListActive(false);

        if (!isCurrentlyActive && newPostBody.trim() === '') {
            setNewPostBody("1. ");
            setListItemCounter(2);
        } else {
            setListItemCounter(1);
        }

        setTimeout(() => textarea.focus(), 0);
    };

    const toggleUnorderedList = () => {
        const textarea = bodyInputRef.current;
        if (!textarea) return;
        const isCurrentlyActive = isUnorderedListActive;

        setIsUnorderedListActive(!isCurrentlyActive);
        setIsOrderedListActive(false);

        if (!isCurrentlyActive && newPostBody.trim() === '') {
            setNewPostBody("• ");
        }

        setTimeout(() => textarea.focus(), 0);
    };

    const handleBodyKeyDown = (e) => {
        if ((isOrderedListActive || isUnorderedListActive) && e.key === 'Enter') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const text = e.target.value;
            let newText;
            let newCursorPosition;

            if (isOrderedListActive) {
                newText = text.substring(0, start) + `\n${listItemCounter}. ` + text.substring(start);
                setNewPostBody(newText);
                setListItemCounter(listItemCounter + 1);
                newCursorPosition = start + `\n${listItemCounter}. `.length;
            } else if (isUnorderedListActive) {
                newText = text.substring(0, start) + `\n• ` + text.substring(start);
                setNewPostBody(newText);
                newCursorPosition = start + `\n• `.length;
            }

            setTimeout(() => {
                bodyInputRef.current.selectionStart = newCursorPosition;
                bodyInputRef.current.selectionEnd = newCursorPosition;
            }, 0);
        }
    };

    const handleBodyInputChange = (e) => {
        setNewPostBody(e.target.value);
    };

    // Poll functions
    const addPollOption = () => {
        setPollOptions([...pollOptions, '']);
    };

    const removePollOption = (index) => {
        if (pollOptions.length > 2) {
            const newOptions = pollOptions.filter((_, i) => i !== index);
            setPollOptions(newOptions);
        }
    };

    const updatePollOption = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const insertPoll = () => {
        const validOptions = pollOptions.filter(option => option.trim() !== '');
        if (validOptions.length < 2) {
            handleAlert('Please add at least 2 poll options', 'warning');
            return;
        }

        const pollText = `\n\n📊 **Poll:**\n${validOptions.map((option, index) => `${index + 1}. ${option}`).join('\n')}\n\n`;

        const currentText = newPostBody;
        const newText = currentText + pollText;
        setNewPostBody(newText);

        setShowPollModal(false);
        setPollOptions(['', '']);
        handleAlert('Poll added to your post!', 'success');
    };

    // Preview function to render markdown-like formatting
    const renderPreview = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
            .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-700">$1</blockquote>')
            .replace(/^(\d+)\. (.*$)/gm, '<div class="ml-4"><span class="text-gray-500">$1.</span> $2</div>')
            .replace(/^• (.*$)/gm, '<div class="ml-4">• $1</div>')
            .split('\n').map((line, i) => {
                if (line.includes('<')) {
                    return `<div key="${i}">${line}</div>`;
                }
                return line ? `<div key="${i}">${line}</div>` : '<br />';
            }).join('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleAlertClose} severity={alertSeverity} variant="filled" sx={{ width: '100%' }}>
                    {alertMessage}
                </Alert>
            </Snackbar>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                        🚀 LaunchIT Community
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 px-2">
                        Share your thoughts, ask questions, and connect with fellow entrepreneurs
                    </p>
                </div>

                {/* New Post Button */}
                {user && (
                    <div className="text-center mb-8">
                        <button
                            onClick={() => setShowNewPostDialog(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 mx-auto"
                        >
                            <Plus className="w-7 h-7" />
                            Post Thread
                        </button>
                    </div>
                )}

                {/* Posts List */}
                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-lg">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageSquare className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No posts yet</h3>
                            <p className="text-gray-600 mb-6 text-lg">Be the first to start a discussion!</p>
                            {user && (
                                <button
                                    onClick={() => setShowNewPostDialog(true)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Plus className="w-5 h-5 inline mr-2" />
                                    Start First Thread
                                </button>
                            )}
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                                {/* Post Header */}
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                                            {post.userInfo?.avatar_url ? (
                                                <img
                                                    src={post.userInfo.avatar_url}
                                                    alt={post.userInfo.full_name || post.userInfo.username}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                (post.userInfo?.full_name || post.userInfo?.username || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-lg truncate">
                                                {post.userInfo?.full_name || post.userInfo?.username || 'Anonymous'}
                                            </p>
                                            {post.userInfo?.email && (
                                                <p className="text-sm text-gray-500 truncate">
                                                    {post.userInfo.email}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <Clock className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">
                                                    {new Date(post.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Post Actions Menu */}
                                    <div className="relative">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-[120px]">
                                            {post.canDelete && (
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleReport(post.id)}
                                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Flag className="w-4 h-4" />
                                                Report
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Post Title and Category */}
                                <div className="mb-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{post.title}</h3>
                                        <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-medium rounded-full capitalize border border-blue-200 self-start">
                                            {post.category || 'general'}
                                        </span>
                                    </div>
                                </div>

                                {/* Post Content */}
                                <div className="mb-6">
                                    <p className="text-gray-800 text-lg leading-relaxed font-medium">{post.content}</p>
                                </div>

                                {/* Post Actions */}
                                <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm border-t border-gray-100 pt-6">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className={`flex items-center gap-3 transition-all duration-300 hover:scale-105 ${post.isLiked
                                            ? 'text-red-600'
                                            : 'text-gray-500 hover:text-red-600'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                        <span className="font-medium">{post.likeCount}</span>
                                    </button>

                                    <button
                                        onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                                        className="flex items-center gap-3 text-gray-500 hover:text-blue-600 transition-all duration-300 hover:scale-105"
                                    >
                                        <Reply className="w-5 h-5" />
                                        <span className="font-medium">{post.replyCount}</span>
                                    </button>

                                    <button className="flex items-center gap-3 text-gray-500 hover:text-green-600 transition-all duration-300 hover:scale-105">
                                        <Share2 className="w-5 h-5" />
                                        <span className="font-medium">Share</span>
                                    </button>
                                </div>

                                {/* Reply Input */}
                                {replyingTo === post.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.split('@')[0]?.charAt(0) || user?.id?.slice(0, 1) || 'U'}
                                            </div>

                                            <div className="flex-1">
                                                <textarea
                                                    placeholder="Write a reply..."
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    rows={2}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                                    maxLength={500}
                                                />

                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-500">
                                                        {replyContent.length}/500 characters
                                                    </span>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(null);
                                                                setReplyContent('');
                                                            }}
                                                            className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                                        >
                                                            Cancel
                                                        </button>

                                                        <button
                                                            onClick={() => handleReply(post.id)}
                                                            disabled={!replyContent.trim()}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm"
                                                        >
                                                            Reply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Poll Modal */}
                {showPollModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                            <h3 className="text-xl font-bold mb-4">Create a Poll</h3>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">Add poll options (minimum 2):</p>

                                {pollOptions.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={`Option ${index + 1}`}
                                            value={option}
                                            onChange={(e) => updatePollOption(index, e.target.value)}
                                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {pollOptions.length > 2 && (
                                            <button
                                                onClick={() => removePollOption(index)}
                                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={addPollOption}
                                    className="w-full p-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                                >
                                    + Add Option
                                </button>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowPollModal(false);
                                        setPollOptions(['', '']);
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={insertPoll}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Add Poll
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Post Dialog */}
                {showNewPostDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">Start new thread</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Posting as: {user?.user_metadata?.full_name || user?.email?.split('@')[0] || `User_${user?.id?.slice(0, 8)}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowNewPostDialog(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Category Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {['general', 'tech', 'business', 'startups', 'products', 'marketing', 'funding'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title Field */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    placeholder="What's your thread about?"
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                    maxLength={200}
                                />
                                <div className="text-sm text-gray-500 mt-1">{newPostTitle.length}/200 characters</div>
                            </div>

                            {/* Body Field */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                                <div className="border border-gray-300 rounded-lg">
                                    {/* Rich Text Toolbar */}
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
                                        <button
                                            onClick={() => formatText('bold')}
                                            className="p-2 hover:bg-gray-200 rounded text-gray-600"
                                            title="Bold (Ctrl+B)"
                                        >
                                            <Bold className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => formatText('italic')}
                                            className="p-2 hover:bg-gray-200 rounded text-gray-600"
                                            title="Italic (Ctrl+I)"
                                        >
                                            <Italic className="w-4 h-4" />
                                        </button>

                                        <div className="w-px h-6 bg-gray-300"></div>

                                        <button
                                            onClick={toggleOrderedList}
                                            className={`p-2 rounded text-gray-600 ${isOrderedListActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
                                            title="Numbered List"
                                        >
                                            <ListOrdered className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={toggleUnorderedList}
                                            className={`p-2 rounded text-gray-600 ${isUnorderedListActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
                                            title="Bulleted List"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>

                                        <div className="w-px h-6 bg-gray-300"></div>

                                        <button
                                            onClick={() => formatText('link')}
                                            className="p-2 hover:bg-gray-200 rounded text-gray-600"
                                            title="Add Link"
                                        >
                                            <Link className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => formatText('code')}
                                            className="p-2 hover:bg-gray-200 rounded text-gray-600"
                                            title="Code Block"
                                        >
                                            <Code className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => formatText('quote')}
                                            className="p-2 hover:bg-gray-200 rounded text-gray-600"
                                            title="Blockquote"
                                        >
                                            <Quote className="w-4 h-4" />
                                        </button>

                                        <div className="w-px h-6 bg-gray-300"></div>

                                        <button
                                            onClick={() => setShowPollModal(true)}
                                            className="p-2 hover:bg-gray-200 rounded text-gray-600"
                                            title="Add Poll"
                                        >
                                            <BarChart2 className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className={`p-2 rounded text-gray-600 ${showPreview ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'}`}
                                            title="Toggle Preview"
                                        >
                                            👁️
                                        </button>
                                    </div>

                                    <textarea
                                        ref={bodyInputRef}
                                        placeholder="Share your thoughts, ask questions, or start a discussion..."
                                        value={newPostBody}
                                        onChange={handleBodyInputChange}
                                        onKeyDown={handleBodyKeyDown}
                                        rows={8}
                                        className="w-full p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none rounded-b-lg"
                                        maxLength={2000}
                                        style={{
                                            borderTopLeftRadius: 0,
                                            borderTopRightRadius: 0,
                                        }}
                                    />

                                    {/* Preview */}
                                    {showPreview && newPostBody.trim() && (
                                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                                            <div className="text-sm text-gray-600 mb-2 font-medium">Preview:</div>
                                            <div
                                                className="prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: renderPreview(newPostBody) }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{newPostBody.length}/2000 characters</div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowNewPostDialog(false)}
                                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleNewPost();
                                        setShowNewPostDialog(false);
                                    }}
                                    disabled={!newPostTitle.trim() || !newPostBody.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Post Thread
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;