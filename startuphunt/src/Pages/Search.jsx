import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowLeft, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ projects: [], users: [], categories: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    const performSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults({ projects: [], users: [], categories: [] });
            return;
        }

        setIsSearching(true);
        try {
            // Search projects
            const { data: projects, error: projectsError } = await supabase
                .from('projects')
                .select('id, name, tagline, category_type, created_at, slug, logo_url')
                .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
                .limit(10);

            if (projectsError) {
                console.error('Projects search error:', projectsError);
            }

            // Search users/profiles
            const { data: users, error: usersError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                .limit(5);

            if (usersError) {
                console.error('Users search error:', usersError);
            }

            // Search categories
            const { data: categories, error: categoriesError } = await supabase
                .from('projects')
                .select('category_type')
                .ilike('category_type', `%${query}%`)
                .limit(5);

            if (categoriesError) {
                console.error('Categories search error:', categoriesError);
            }

            setSearchResults({
                projects: projects || [],
                users: users || [],
                categories: [...new Set(categories?.map(c => c.category_type).filter(Boolean) || [])]
            });
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.trim()) {
            setShowSuggestions(true);
            performSearch(value);
        } else {
            setShowSuggestions(false);
            setSearchResults({ projects: [], users: [], categories: [] });
        }
    };

    const handleResultClick = (type, data) => {
        setShowSuggestions(false);
        if (type === 'project') {
            navigate(`/launches/${data.slug}`);
        } else if (type === 'user') {
            navigate(`/profile/${data.username}`);
        } else if (type === 'category') {
            navigate(`/category/${data.category_type}`);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setShowSuggestions(false);
        setSearchResults({ projects: [], users: [], categories: [] });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1 relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search startups, users, categories, tags..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setShowSuggestions(true)}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Results */}
            {showSuggestions && (
                <div className="px-4 py-4">
                    {isSearching ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Searching...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Projects */}
                            {searchResults.projects.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Projects</h3>
                                    <div className="space-y-2">
                                        {searchResults.projects.map((project) => (
                                            <button
                                                key={project.id}
                                                onClick={() => handleResultClick('project', project)}
                                                className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                                            >
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    {project.logo_url ? (
                                                        <img src={project.logo_url} alt={project.name} className="w-6 h-6 rounded object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-blue-500 rounded"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 truncate">{project.name}</div>
                                                    <div className="text-sm text-gray-500 truncate">{project.tagline}</div>
                                                    <div className="text-xs text-gray-400">{project.category_type}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Users */}
                            {searchResults.users.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Users</h3>
                                    <div className="space-y-2">
                                        {searchResults.users.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleResultClick('user', user)}
                                                className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                                            >
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 truncate">@{user.username}</div>
                                                    <div className="text-sm text-gray-500 truncate">{user.full_name}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Categories */}
                            {searchResults.categories.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
                                    <div className="space-y-2">
                                        {searchResults.categories.map((category) => (
                                            <button
                                                key={category}
                                                onClick={() => handleResultClick('category', { category_type: category })}
                                                className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                                            >
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-sm font-medium">{category.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 capitalize">{category}</div>
                                                    <div className="text-sm text-gray-500">Category</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No Results */}
                            {!isSearching && searchQuery && 
                             searchResults.projects.length === 0 && 
                             searchResults.users.length === 0 && 
                             searchResults.categories.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">No results found for "{searchQuery}"</p>
                                    <p className="text-sm text-gray-400 mt-2">Try different keywords or check your spelling</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!showSuggestions && (
                <div className="px-4 py-8 text-center">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Everything</h2>
                    <p className="text-gray-600">Find startups, users, categories, and more</p>
                </div>
            )}
        </div>
    );
};

export default SearchPage; 