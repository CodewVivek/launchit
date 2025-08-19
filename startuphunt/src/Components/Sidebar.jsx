import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Rocket,
    TrendingUp,
    Users,
    Settings,
    Bookmark,
    Heart,
    MessageSquare,
    Calendar,
    X,
    Menu,
    Search,
    Bell,
    User,
    LogOut,
    CirclePlus,
    Video,
    Monitor,
    Tag,
    Star
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

const Sidebar = ({ isOpen, isProjectDetails, onClose }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const location = useLocation();

    useEffect(() => {
        const getUser = async () => {
            try {
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
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };

        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('category_type')
                    .not('category_type', 'is', null);

                if (error) throw error;

                const uniqueCategories = [...new Set(data.map(item => item.category_type))];
                setCategories(uniqueCategories.slice(0, 10)); // Limit to 10 categories
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        getUser();
        fetchCategories();
    }, []);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Signed out successfully');
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error('Error signing out');
        }
    };

    const isActive = (path) => location.pathname === path;

    const navigationItems = [
        { icon: Home, label: 'Home', path: '/', color: 'text-blue-600' },
        { icon: Rocket, label: 'Launches', path: '/', color: 'text-green-600' },
        { icon: TrendingUp, label: 'Trending', path: '/', color: 'text-purple-600' },
        { icon: Users, label: 'Community', path: '/launchit-community', color: 'text-orange-600' },
        { icon: Calendar, label: 'Coming Soon', path: '/coming-soon', color: 'text-red-600' },
    ];

    const userMenuItems = [
        { icon: Bookmark, label: 'Saved Projects', path: '/saved-projects' },
        { icon: Heart, label: 'Upvoted', path: '/upvoted-projects' },
        { icon: MessageSquare, label: 'My Comments', path: '/my-comments' },
        { icon: Users, label: 'Followers', path: '/followers-following' },
        { icon: Rocket, label: 'My Launches', path: '/my-launches' },
    ];

    if (isProjectDetails) {
        return null; // Don't show sidebar on project details page
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 lg:w-60
      `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
                    <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
                    <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onClose}>
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col h-full overflow-y-auto">
                    {/* Navigation */}
                    <nav className="p-4 space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Navigation
                        </h3>
                        {navigationItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive(item.path)
                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }
                `}
                            >
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Categories */}
                    <div className="px-4 pb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Categories
                        </h3>
                        <div className="space-y-1">
                            {loading ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                categories.map((category) => (
                                    <Link
                                        key={category}
                                        to={`/?category=${encodeURIComponent(category)}`}
                                        className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
                      ${location.search.includes(category)
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }
                    `}
                                    >
                                        <Monitor className="w-4 h-4" />
                                        <span className="capitalize">{category}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* User Menu */}
                    {user && (
                        <div className="px-4 pb-4 mt-auto">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                My Account
                            </h3>
                            <div className="space-y-1">
                                {userMenuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
                      ${isActive(item.path)
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-50'
                                            }
                    `}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                                <Link
                                    to="/settings"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm text-gray-600 hover:bg-gray-50"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm text-red-600 hover:bg-red-50 w-full"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Admin Section */}
                    {userRole === 'admin' && (
                        <div className="px-4 pb-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Admin
                            </h3>
                            <Link
                                to="/admin"
                                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
                  ${isActive('/admin')
                                        ? 'bg-red-50 text-red-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }
                `}
                            >
                                <Star className="w-4 h-4" />
                                <span>Admin Dashboard</span>
                            </Link>
                        </div>
                    )}

                    {/* Submit Section */}
                    <div className="px-4 pb-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                            <h3 className="text-sm font-semibold text-blue-800 mb-2">
                                Have a project?
                            </h3>
                            <p className="text-xs text-blue-600 mb-3">
                                Launch your startup and get discovered by thousands of users.
                            </p>
                            <div className="space-y-2">
                                <Link
                                    to="/submit"
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <CirclePlus className="w-4 h-4" />
                                    Submit Project
                                </Link>
                                {user && (
                                    <Link
                                        to="/upload-pitch"
                                        className="flex items-center gap-2 px-3 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors border border-blue-200"
                                    >
                                        <Video className="w-4 h-4" />
                                        Upload Pitch
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;