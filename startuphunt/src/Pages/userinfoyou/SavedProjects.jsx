import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Bookmark, ExternalLink, Calendar, Tag, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SavedProjects = () => {
    const [user, setUser] = useState(null);
    const [savedProjects, setSavedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to view your saved projects");
                navigate("/UserRegister");
                return;
            }
            setUser(user);
            fetchSavedProjects(user.id);
        };

        checkAuth();
    }, [navigate]);

    const fetchSavedProjects = async (userId) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('saved_projects')
                .select(`
                    id,
                    created_at,
                    projects (
                        id,
                        name,
                        tagline,
                        description,
                        website_url,
                        category_type,
                        created_at,
                        slug,
                        thumbnail_url,
                        logo_url
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching saved projects:', error);
                setError('Failed to load your saved projects');
                toast.error('Failed to load your saved projects');
            } else {
                // Filter out any null projects and extract the project data
                const validProjects = data
                    ?.filter(item => item.projects !== null)
                    ?.map(item => ({
                        ...item.projects,
                        saved_at: item.created_at,
                        saved_id: item.id
                    })) || [];

                setSavedProjects(validProjects);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred while loading your saved projects');
            toast.error('An error occurred while loading your saved projects');
        } finally {
            setLoading(false);
        }
    };

    const removeFromSaved = async (savedId, projectName) => {
        try {
            const { error } = await supabase
                .from('saved_projects')
                .delete()
                .eq('id', savedId);

            if (error) {
                console.error('Error removing from saved:', error);
                toast.error('Failed to remove from saved');
            } else {
                setSavedProjects(prev => prev.filter(project => project.saved_id !== savedId));
                toast.success(`Removed "${projectName}" from saved projects`);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while removing from saved');
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
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-16">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                        <p className="text-gray-600">Loading your saved projects...</p>
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
        <div className="min-h-screen ">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Saved Projects</h1>
                        <p className="text-gray-600 mt-1">
                            {savedProjects.length} {savedProjects.length === 1 ? 'project' : 'projects'} saved
                        </p>
                    </div>
                </div>

                {/* Content */}
                {savedProjects.length === 0 ? (
                    <div className="text-center py-16">
                        <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">No saved projects yet</h2>
                        <p className="text-gray-600 mb-6">
                            Start exploring projects and save the ones you like to view them later.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Explore Projects
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedProjects.map((project) => (
                            <div
                                key={project.saved_id}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group relative"
                            >
                                {/* Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromSaved(project.saved_id, project.name);
                                    }}
                                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-10"
                                    title="Remove from saved"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Thumbnail */}
                                <div
                                    className="aspect-video bg-gray-100 overflow-hidden cursor-pointer"
                                    onClick={() => openProjectDetails(project)}
                                >
                                    {project.thumbnail_url ? (
                                        <img
                                            src={project.thumbnail_url}
                                            alt={project.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="eager"
                                            fetchPriority="high"
                                            decoding="async"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Bookmark className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Logo and Name */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            {project.logo_url ? (
                                                <img
                                                    src={project.logo_url}
                                                    alt={project.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <Bookmark className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => openProjectDetails(project)}>
                                                {project.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate">
                                                {project.tagline}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Category and Saved Date */}
                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Tag className="w-4 h-4" />
                                            <span className="capitalize">{project.category_type}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Saved {formatDate(project.saved_at)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (project.website_url) {
                                                    window.open(project.website_url, '_blank');
                                                }
                                            }}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Visit Site
                                        </button>
                                        <span className="text-xs text-gray-400">
                                            Click to view details
                                        </span>
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

export default SavedProjects; 