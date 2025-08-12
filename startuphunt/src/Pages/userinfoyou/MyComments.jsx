import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, MessageSquare, ExternalLink, Calendar, Tag, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MyComments = () => {
    const [user, setUser] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to view your comments");
                navigate("/UserRegister");
                return;
            }
            setUser(user);
            fetchUserComments(user.id);
        };

        checkAuth();
    }, [navigate]);

    const fetchUserComments = async (userId) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    content,
                    created_at,
                    projects (
                        id,
                        name,
                        tagline,
                        category_type,
                        slug,
                        thumbnail_url,
                        logo_url
                    )
                `)
                .eq('user_id', userId)
                .eq('deleted', false)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching comments:', error);
                setError('Failed to load your comments');
                toast.error('Failed to load your comments');
            } else {
                // Filter out any null projects and extract the comment data
                const validComments = data
                    ?.filter(item => item.projects !== null)
                    ?.map(item => ({
                        ...item,
                        project: item.projects
                    })) || [];

                setComments(validComments);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred while loading your comments');
            toast.error('An error occurred while loading your comments');
        } finally {
            setLoading(false);
        }
    };

    const deleteComment = async (commentId, commentContent) => {
        try {
            const { error } = await supabase
                .from('comments')
                .update({ deleted: true })
                .eq('id', commentId);

            if (error) {
                console.error('Error deleting comment:', error);
                toast.error('Failed to delete comment');
            } else {
                setComments(prev => prev.filter(comment => comment.id !== commentId));
                toast.success('Comment deleted successfully');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while deleting the comment');
        }
    };

    const openProjectDetails = (project) => {
        navigate(`/launches/${project.slug}`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const truncateText = (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                        <p className="text-gray-600">Loading your comments...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Your Comments</h1>
                        <p className="text-gray-600 mt-1">
                            {comments.length} {comments.length === 1 ? 'comment' : 'comments'} made
                        </p>
                    </div>
                </div>

                {/* Content */}
                {comments.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No comments yet</h2>
                        <p className="text-gray-600 mb-6">
                            Start exploring projects and leave comments to see them here.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Explore Projects
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                            >
                                {/* Project Header */}
                                <div
                                    className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => openProjectDetails(comment.project)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            {comment.project.logo_url ? (
                                                <img
                                                    src={comment.project.logo_url}
                                                    alt={comment.project.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <MessageSquare className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                                                {comment.project.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Tag className="w-4 h-4" />
                                                <span className="capitalize">{comment.project.category_type}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteComment(comment.id, comment.content);
                                            }}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete comment"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Comment Content */}
                                <div className="p-4">
                                    <p className="text-gray-800 mb-3">
                                        {truncateText(comment.content, 200)}
                                    </p>

                                    {/* Comment Metadata */}
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(comment.created_at)}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openProjectDetails(comment.project);
                                            }}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            View Project
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyComments; 