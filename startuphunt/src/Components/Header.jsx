import React, { useState, useEffect, useCallback } from "react";
import {
    Rocket, CirclePlus, CircleUserRound, Settings, LogOut, User, Menu, X, Video, Search, ChevronDown, Monitor, Tag
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import NotificationBell from "./NotificationBell";


const Header = ({ onMenuClick }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [launchDropdownOpen, setLaunchDropdownOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState({ projects: [], users: [], categories: [], tags: [], aiSuggestions: [] });
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                setUserRole(profile?.role);
            }
        };
        getUser();

        // Remove real-time auth subscription to reduce database load
        // Auth state will be checked on-demand when needed
    }, []);

    const handlepopover = () => {
        setAnchorEl(anchorEl ? null : "anchorEl");
    };

    const open = Boolean(anchorEl);
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast.success("Signed out successfully");
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
            toast.error("Error signing out");
        }
    };

    const handleProfileClick = async () => {
        if (!user) return;
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();
            if (profile?.username) {
                navigate(`/profile/${profile.username}`);
            } else {
                toast.error("Profile not found");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Error loading profile");
        }
        handleClose();
    };

    // Simple fallback search - just search projects by name
    const performFallbackSearch = useCallback(async (query) => {
        try {
            const { data: projects, error } = await supabase
                .from('projects')
                .select('id, name, tagline, category_type, created_at, slug, logo_url')
                .ilike('name', `%${query}%`)
                .limit(5);

            if (error) {
                console.error('Fallback search error:', error);
                return;
            }

            setSearchSuggestions({
                projects: projects || [],
                users: [],
                categories: [],
                tags: []
            });
        } catch (error) {
            console.error('Fallback search failed:', error);
        }
    }, []);

    // Universal search functionality
    const performSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchSuggestions({ projects: [], users: [], categories: [], tags: [], aiSuggestions: [] });
            return;
        }

        setIsSearching(true);
        try {
            // Search projects
            const { data: projects, error: projectsError } = await supabase
                .from('projects')
                .select('id, name, tagline, category_type, created_at, slug, logo_url')
                .or(`name.ilike.%${query}%,tagline.ilike.%${query}%,category_type.ilike.%${query}%`)
                .limit(3);

            if (projectsError) {
                console.error('Projects search error:', projectsError);
            }

            // Search users/profiles
            const { data: users, error: usersError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                .limit(3);

            if (usersError) {
                console.error('Users search error:', usersError);
            }

            // Search categories (from projects)
            const { data: categories, error: categoriesError } = await supabase
                .from('projects')
                .select('category_type')
                .ilike('category_type', `%${query}%`)
                .limit(3);

            if (categoriesError) {
                console.error('Categories search error:', categoriesError);
            }

            // Search tags (from projects) - tags is ARRAY type in database
            let tagMatches = [];
            try {
                const { data: tagProjects, error: tagError } = await supabase
                    .from('projects')
                    .select('id, name, slug, logo_url, tags')
                    .limit(10);

                if (tagError) {
                    console.error('Tags search error:', tagError);
                } else if (tagProjects) {
                    // Filter projects that contain the search query in their tags array
                    tagMatches = tagProjects.filter(project =>
                        project.tags &&
                        Array.isArray(project.tags) &&
                        project.tags.length > 0 &&
                        project.tags.some(tag =>
                            tag && typeof tag === 'string' && tag.toLowerCase().includes(query.toLowerCase())
                        )
                    ).slice(0, 3);
                }
            } catch (tagFilterError) {
                console.error('Tag filtering error:', tagFilterError);
            }

            setSearchSuggestions({
                projects: projects || [],
                users: users || [],
                categories: [...new Set(categories?.map(c => c.category_type).filter(Boolean) || [])],
                tags: tagMatches
            });
        } catch (error) {
            console.error('Search error:', error);
            // Try fallback search if main search fails
            await performFallbackSearch(query);
        } finally {
            setIsSearching(false);
        }
    }, [performFallbackSearch]);

    const handleSearchChange = useCallback((e) => {
        try {
            const value = e?.target?.value || '';
            setSearch(value);
            if (value.trim()) {
                setShowSearchSuggestions(true);
                // Debounce the search to avoid too many API calls
                const timeoutId = setTimeout(() => {
                    performSearch(value);
                }, 300);
                return () => clearTimeout(timeoutId);
            } else {
                setShowSearchSuggestions(false);
                setSearchSuggestions({ projects: [], users: [], categories: [], tags: [], aiSuggestions: [] });
            }
        } catch (error) {
            console.error('Search input error:', error);
            // Don't show error toast for input errors, just log them
        }
    }, [performSearch]);

    const handleSearchFocus = () => {
        try {
            if (search.trim()) {
                setShowSearchSuggestions(true);
            }
        } catch (error) {
            console.error('Search focus error:', error);
        }
    };

    const handleSearchBlur = () => {
        try {
            // Delay hiding suggestions to allow clicking on them
            setTimeout(() => {
                setShowSearchSuggestions(false);
            }, 200);
        } catch (error) {
            console.error('Search blur error:', error);
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (launchDropdownOpen && !event.target.closest('.launch-dropdown')) {
                setLaunchDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [launchDropdownOpen]);

    const handleSuggestionClick = (type, item) => {
        if (type === 'project') {
            navigate(`/launches/${item.slug}`);
        } else if (type === 'user') {
            navigate(`/profile/${item.username}`);
        } else if (type === 'category') {
            navigate(`/?category=${encodeURIComponent(item)}`);
        }
        setShowSearchSuggestions(false);
        setSearch("");
    };

    const handleLaunchDropdownToggle = () => {
        setLaunchDropdownOpen(!launchDropdownOpen);
    };

    const handleLaunchItemClick = (action) => {
        setLaunchDropdownOpen(false);
        if (action === 'submit') {
            navigate('/submit');
        } else if (action === 'pitch') {
            navigate('/upload-pitch');
        }
    };

    const totalSuggestions = (searchSuggestions?.projects?.length || 0) +
        (searchSuggestions?.users?.length || 0) +
        (searchSuggestions?.categories?.length || 0) +
        (searchSuggestions?.tags?.length || 0);

    return (
        <header className="fixed top-0 left-0 right-0 z-[50] flex items-center justify-between px-2 sm:px-4 py-3 sm:py-4 bg-gray-800  min-h-[64px] sm:min-h-[72px]">

            {/* Left side with menu button and logo */}
            <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                    className="p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 text-gray-800 focus:outline-none"
                    onClick={onMenuClick}
                    aria-label="Toggle sidebar menu"
                >
                    <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
                <Link to="/" className="flex items-center space-x-2 sm:space-x-2 group">
                    <div className="rounded flex items-center justify-center">
                        <img className="w-8 h-8 sm:w-9 sm:h-9 text-white" src="/images/r6_circle_optimized.png" alt="L" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold tracking-wide hidden sm:block">
                        <span className="text-gray-800">launchit</span>
                    </span>
                </Link>
            </div>

            {/* Universal Search Bar - Hidden on mobile */}
            <div className="hidden md:block flex-1 mx-8">
                <div className="relative w-full max-w-lg mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            value={search || ''}
                            onChange={(e) => {
                                const value = e.target.value || '';
                                setSearch(value);
                                if (value.trim()) {
                                    setShowSearchSuggestions(true);
                                    performSearch(value);
                                } else {
                                    setShowSearchSuggestions(false);
                                }
                            }}
                            onFocus={handleSearchFocus}
                            onBlur={handleSearchBlur}
                            placeholder="Search projects, users, categories..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSearching}
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>
                    {search && (
                        <button
                            type="button"
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none text-lg"
                            onClick={() => {
                                setSearch("");
                                setShowSearchSuggestions(false);
                            }}
                            aria-label="Clear search"
                        >
                            &times;
                        </button>
                    )}
                    {showSearchSuggestions && totalSuggestions > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-[130]">
                            {isSearching ? (
                                <div className="p-4 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Searching...</p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {searchSuggestions.projects?.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Projects
                                            </div>
                                            {searchSuggestions.projects.map((project) => (
                                                <button
                                                    key={project.id}
                                                    onClick={() => handleSuggestionClick('project', project)}
                                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                                                >
                                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        {project.logo_url ? (
                                                            <img src={project.logo_url} alt={project.name} className="w-6 h-6 rounded object-cover" />
                                                        ) : (
                                                            <Rocket className="w-4 h-4 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">{project.name}</div>
                                                        <div className="text-sm text-gray-500 truncate">{project.category_type}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searchSuggestions.users?.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Users
                                            </div>
                                            {searchSuggestions.users.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleSuggestionClick('user', user)}
                                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                                                >
                                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded object-cover" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">{user.username}</div>
                                                        <div className="text-sm text-gray-500 truncate">{user.full_name}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searchSuggestions.categories?.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Categories
                                            </div>
                                            {searchSuggestions.categories.map((category) => (
                                                <button
                                                    key={category}
                                                    onClick={() => handleSuggestionClick('category', { category_type: category })}
                                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                                                >
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Monitor className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">{category}</div>
                                                        <div className="text-sm text-gray-500">Category</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searchSuggestions.tags?.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Tagged Projects
                                            </div>
                                            {searchSuggestions.tags.map((project) => (
                                                <button
                                                    key={project.id}
                                                    onClick={() => handleSuggestionClick('project', project)}
                                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                                                >
                                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Tag className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">{project.name}</div>
                                                        <div className="text-sm text-gray-500">Tagged Project</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
                {/* + Launch Dropdown */}
                <div className="relative launch-dropdown">
                    <button
                        onClick={handleLaunchDropdownToggle}
                        className="flex items-center gap-2 px-4 py-2  text-black rounded-full hover:bg-gray-300 transition-colors"
                    >
                        <CirclePlus className="w-4 h-4" />
                        Launch
                        <ChevronDown className={`w-4 h-4 transition-transform ${launchDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {launchDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[130]">
                            <button
                                onClick={() => handleLaunchItemClick('submit')}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <CirclePlus className="w-4 h-4 mr-2" />
                                Submit
                            </button>
                            {user && (
                                <button
                                    onClick={() => handleLaunchItemClick('pitch')}
                                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Pitch
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <Link to="/coming-soon" className="text-gray-800  font-medium flex items-center gap-2   ">
                    <Rocket className="w-4 h-4" />
                    Coming Soon
                </Link>

                {userRole === "admin" && (
                    <Link to="/admin" className="text-gray-800  font-medium rounded ">Admin</Link>
                )}

                {user && <NotificationBell />}

                {/* User Dropdown */}
                <div className="user-dropdown relative">
                    <button className="p-2 rounded-full hover:bg-white/20" onClick={handlepopover}>
                        {user ? (
                            <img
                                src={user.user_metadata?.avatar_url || user.user_metadata?.picture || 'https://via.placeholder.com/32'}
                                alt="profile"
                                className="w-6 h-6 rounded-full"
                            />
                        ) : (
                            <CircleUserRound className="w-6 h-6 text-white" />
                        )}
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[130]">
                            {user ? (
                                <>
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.user_metadata?.avatar_url || "https://via.placeholder.com/32"}
                                                alt="profile"
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <p className="text-sm font-semibold text-gray-700">
                                                {user.user_metadata?.full_name || user.user_metadata?.name || "No Name"}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 truncate max-w-[160px] block">{user.email}</p>
                                    </div>

                                    <div className="py-1">
                                        <button onClick={handleProfileClick}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <User className="w-4 h-4 mr-2" />
                                            Profile
                                        </button>
                                        <button onClick={() => { handleClose(); navigate("/settings"); }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <Settings className="w-4 h-4 mr-2" />
                                            Settings
                                        </button>
                                        <button onClick={() => { handleClose(); handleSignOut(); }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="py-1">
                                    <button onClick={() => { handleClose(); navigate("/UserRegister"); }}
                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-600">
                                        <CircleUserRound className="w-4 h-4 mr-2" />
                                        Sign In
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Mobile Navigation - Right Side (Refactored) */}
            <div className="md:hidden flex items-center space-x-2 sm:space-x-3">
                {/* Launch Dropdown Mobile */}
                <div className="relative launch-dropdown">
                    <button
                        onClick={handleLaunchDropdownToggle}
                        className="flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 text-black rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <CirclePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">Launch</span>
                    </button>

                    {launchDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[130]">
                            <button
                                onClick={() => handleLaunchItemClick('submit')}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <CirclePlus className="w-4 h-4 mr-2" />
                                Submit
                            </button>
                            {user && (
                                <button
                                    onClick={() => handleLaunchItemClick('pitch')}
                                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Pitch
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Coming Soon Mobile (New) */}
                <Link to="/coming-soon" className="text-gray-800 font-medium flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:bg-gray-100 transition-colors">
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Soon</span>
                </Link>

                {/* Notifications Mobile */}
                {user && <NotificationBell />}

                {/* User Dropdown Mobile */}
                <div className="user-dropdown relative">
                    <button className="p-2 sm:p-2.5 rounded-full hover:bg-white/20" onClick={handlepopover}>
                        {user ? (
                            <img
                                src={user.user_metadata?.avatar_url || user.user_metadata?.picture || 'https://via.placeholder.com/32'}
                                alt="profile"
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full"
                            />
                        ) : (
                            <CircleUserRound className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        )}
                    </button>
                    {open && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[130]">
                            {user ? (
                                <>
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.user_metadata?.avatar_url || "https://via.placeholder.com/32"}
                                                alt="profile"
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <p className="text-sm font-semibold text-gray-700">
                                                {user.user_metadata?.full_name || user.user_metadata?.name || "No Name"}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 truncate max-w-[160px] block">{user.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <button onClick={handleProfileClick}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <User className="w-4 h-4 mr-2" />
                                            Profile
                                        </button>
                                        <button onClick={() => { handleClose(); navigate("/settings"); }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <Settings className="w-4 h-4 mr-2" />
                                            Settings
                                        </button>
                                        <button onClick={() => { handleClose(); handleSignOut(); }}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="py-1">
                                    <button onClick={() => { handleClose(); navigate("/UserRegister"); }}
                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        <CircleUserRound className="w-4 h-4 mr-2" />
                                        Sign In
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Mobile Search Bar */}
            <div className="block md:hidden absolute top-full left-0 right-0 px-3 sm:px-4 py-2 bg-white border-t border-gray-200 z-30">
                <div className="relative w-full max-w-full mx-auto">
                    <input
                        type="text"
                        placeholder="Search startups, users, categories, tags..."
                        className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 bg-white shadow text-sm"
                        value={search}
                        onChange={handleSearchChange}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setShowSearchSuggestions(false);
                            }
                        }}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <Search className="w-4 h-4" />
                    </span>
                    {search && (
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none text-lg"
                            onClick={() => {
                                setSearch("");
                                setShowSearchSuggestions(false);
                            }}
                            aria-label="Clear search"
                        >
                            &times;
                        </button>
                    )}
                </div>
            </div>
        </header >
    );
};

export default Header;