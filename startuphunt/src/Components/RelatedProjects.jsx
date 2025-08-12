import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Like from "../Components/Like";
import { ExternalLink, Tag, Rocket, Calendar, Eye } from "lucide-react";

const RelatedProjects = ({ categoryType, excludeProjectId }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [fallbackProjects, setFallbackProjects] = useState([]);

    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("category_type", categoryType)
                .neq("id", excludeProjectId)
                .neq("status", "draft")
                .limit(6);
            setProjects(data || []);
            // If no related, fetch fallback
            if (!data || data.length === 0) {
                const { data: fallback, error: fallbackError } = await supabase
                    .from("projects")
                    .select("*")
                    .neq("id", excludeProjectId)
                    .neq("status", "draft")
                    .limit(6);
                setFallbackProjects(fallback || []);
            } else {
                setFallbackProjects([]);
            }
            setLoading(false);
        };
        if (categoryType && excludeProjectId) fetchRelated();
    }, [categoryType, excludeProjectId]);

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        if (diffInMinutes < 1) return "just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays}d ago`;

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths}mo ago`;

        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears}y ago`;
    };

    if (loading)
        return (
            <div className="mt-12">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading related projects...</span>
                </div>
            </div>
        );

    const displayProjects = projects.length ? projects : fallbackProjects;
    if (!displayProjects.length) return null;

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {projects.length ? "Related Projects" : "Explore More"}
                    </h3>
                    <p className="text-gray-600 mt-1">
                        {projects.length
                            ? `More ${categoryType} projects you might like`
                            : "Discover amazing projects from our community"
                        }
                    </p>
                </div>
                {!projects.length && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                        <Rocket className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                            Trending
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProjects.map((project) => (
                    <div
                        key={project.id}
                        className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden"
                        onClick={() => navigate(`/launches/${project.slug}`)}
                    >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gray-100 overflow-hidden">
                            {project.thumbnail_url ? (
                                <img
                                    src={project.thumbnail_url}
                                    alt={`${project.name} thumbnail`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <span className="text-sm text-gray-500">No Image</span>
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <a
                                    href={project.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/90 rounded-lg shadow-lg hover:bg-white transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="w-4 h-4 text-gray-700" />
                                </a>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-2">
                            {/* Header with logo and name */}
                            <div className="flex items-start gap-3 mb-3">
                                {project.logo_url ? (
                                    <img
                                        src={project.logo_url}
                                        alt={`${project.name} logo`}
                                        className="w-10 h-10 object-contain rounded-lg border bg-white flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {project.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {project.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                        {project.tagline}
                                    </p>
                                </div>
                            </div>

                            {/* Meta information */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Tag className="w-4 h-4" />
                                    <span className="capitalize font-medium text-gray-700">
                                        {project.category_type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>{getTimeAgo(project.created_at)}</span>
                                </div>
                            </div>

                            {/* Footer with likes and view button */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <Like projectId={project.id} iconOnly={true} />
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/launches/${project.slug}`);
                                    }}
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View all button */}
            <div className="mt-8 text-center">
                <button
                    onClick={() => navigate("/")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                    <Rocket className="w-5 h-5" />
                    Discover More Projects
                </button>
            </div>
        </div>
    );
};

export default RelatedProjects; 