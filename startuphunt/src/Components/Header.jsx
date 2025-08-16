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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
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

    // Universal search functionality
    const performSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchSuggestions({ projects: [], users: [], categories: [], tags: [], aiSuggestions: [] });
            return;
        }

        setIsSearching(true);
        try {
            // Search projects
            const { data: projects } = await supabase
                .from('projects')
                .select('id, name, tagline, category_type, created_at, slug, logo_url')
                .or(`name.ilike.%${query}%,tagline.ilike.%${query}%,category_type.ilike.%${query}%`)
                .limit(3);

            // Search users/profiles
            const { data: users } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                .limit(3);

            // Search categories (from projects)
            const { data: categories } = await supabase
                .from('projects')
                .select('category_type')
                .ilike('category_type', `%${query}%`)
                .limit(3);

            // Search tags (from projects)
            const { data: tagProjects } = await supabase
                .from('projects')
                .select('id, name, slug, logo_url, tags')
                .not('tags', 'is', null)
                .limit(10);

            // Filter projects that contain the search query in their tags
            const tagMatches = tagProjects?.filter(project =>
                project.tags &&
                project.tags.some(tag =>
                    tag.toLowerCase().includes(query.toLowerCase())
                )
            ).slice(0, 3) || [];

            // AI suggestions removed - using basic search only

            setSearchSuggestions({
                projects: projects || [],
                users: users || [],
                categories: [...new Set(categories?.map(c => c.category_type) || [])],
                tags: tagMatches
            });
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setSearch(value);
        if (value.trim()) {
            setShowSearchSuggestions(true);
            performSearch(value);
        } else {
            setShowSearchSuggestions(false);
        }
    }, [performSearch]);

    const handleSearchFocus = () => {
        if (search.trim()) {
            setShowSearchSuggestions(true);
        }
    };

    const handleSearchBlur = () => {
        // Delay hiding suggestions to allow clicking on them
        setTimeout(() => {
            setShowSearchSuggestions(false);
        }, 200);
    };

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

    const totalSuggestions = (searchSuggestions.projects?.length || 0) +
        (searchSuggestions.users?.length || 0) +
        (searchSuggestions.categories?.length || 0) +
        (searchSuggestions.tags?.length || 0);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-white ">

            {/* Left side with menu button and logo */}
            <div className="flex items-center space-x-4">
                <button
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-800 focus:outline-none"
                    onClick={onMenuClick}
                    aria-label="Toggle sidebar menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="rounded flex items-center justify-center">
                        <img className="w-8 h-8 text-white" src="/images/r6_circle.png" alt="L" />
                    </div>
                    <span className="text-xl font-bold tracking-wide hidden sm:block">
                        <span className="text-gray-800">LaunchIT</span>
                    </span>
                </Link>
            </div>

            {/* Universal Search Bar - Hidden on mobile */}
            <div className="hidden md:block flex-1 mx-8">
                <div className="relative w-full max-w-lg mx-auto">
                    <input
                        type="text"
                        placeholder="Search startups, users, categories, tags..."
                        className="w-full pl-12 pr-12 py-2 rounded-full border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 bg-white shadow"
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
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <Search className="w-5 h-5" />
                    </span>
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

                    {/* Search Suggestions Dropdown */}
                    {showSearchSuggestions && totalSuggestions > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                            {isSearching ? (
                                <div className="p-4 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                                    <p className="text-sm text-gray-500 mt-2">Searching...</p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {/* Projects */}
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



                                    {/* Users */}
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

                                    {/* Categories */}
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

                                    {/* Tags */}
                                    {searchSuggestions.tags?.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Tags
                                            </div>
                                            {searchSuggestions.tags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => handleSuggestionClick('tag', { tag })}
                                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                                                >
                                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Tag className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-900 truncate">{tag}</div>
                                                        <div className="text-sm text-gray-500">Tag</div>
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
                <div className="relative">
                    <button
                        onClick={handleLaunchDropdownToggle}
                        className="flex items-center gap-2 px-4 py-2  text-black rounded-full hover:bg-gray-300 transition-colors"
                    >
                        <CirclePlus className="w-4 h-4" />
                        Launch
                    </button>

                    {launchDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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

                <Link to="/coming-soon" className="text-gray-800 text-gray-800font-medium flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Coming Soon
                </Link>

                {userRole === "admin" && (
                    <Link to="/admin" className="text-gray-800 text-gray-800font-medium">Admin</Link>
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
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
            </nav>

            {/* Mobile Navigation - Right Side */}
            <div className="md:hidden flex items-center space-x-2">
                {/* + Launch Dropdown Mobile */}
                <div className="relative">
                    <button
                        onClick={handleLaunchDropdownToggle}
                        className="flex items-center gap-1 px-3 py-2 text-black rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <CirclePlus className="w-4 h-4" />
                        <span className="text-sm">Launch</span>
                    </button>

                    {launchDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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

                {/* Notifications Mobile */}
                {user && <NotificationBell />}

                {/* User Dropdown Mobile */}
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
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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

                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-white/20 text-white"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>
            {/* Mobile Search Bar */}
            <div className="block md:hidden px-4 pb-2 bg-blue-500">
                <div className="relative w-full max-w-full mx-auto">
                    <input
                        type="text"
                        placeholder="Search startups, users, categories, tags..."
                        className="w-full pl-12 pr-12 py-2 rounded-full border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-gray-500 bg-white shadow"
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
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <Search className="w-5 h-5" />
                    </span>
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
                </div>
            </div>

            {/* Mobile Menu */}
            {
                mobileMenuOpen && (
                    <div className="md:hidden bg-blue-500 border-t border-blue-400">
                        <div className="px-4 py-2 space-y-2">
                            <Link to="/submit" className="block text-gray-800 text-gray-800font-medium flex items-center gap-2 py-2">
                                <CirclePlus className="w-4 h-4" />
                                Submit
                            </Link>
                            {user && (
                                <Link to="/upload-pitch" className="block text-gray-800 text-gray-800font-medium flex items-center gap-2 py-2">
                                    <Video className="w-4 h-4" />
                                    Pitch
                                </Link>
                            )}
                            <Link to="/coming-soon" className="block text-/90 text-gray-800font-medium flex items-center gap-2 py-2">
                                <Rocket className="w-4 h-4" />
                                Coming Soon
                            </Link>
                            {userRole === "admin" && (
                                <Link to="/admin" className="block text-gray-800 text-gray-800 font-medium py-2">Admin</Link>
                            )}
                        </div>
                    </div>
                )
            }
        </header >
    );
};

export default Header;