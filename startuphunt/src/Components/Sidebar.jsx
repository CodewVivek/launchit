import React, { useState, useEffect } from "react";
import {
    Home, Scissors, Monitor, Clock, Download, Clipboard, History, PlaySquare, User, ChevronRight, Search
} from "lucide-react";
import { Rocket, Bookmark, ThumbsUp, Trophy, MessageSquare, Users } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const Sidebar = ({ isOpen }) => {
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [showMoreCategories, setShowMoreCategories] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isProjectDetails = location.pathname.startsWith("/launches/");

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        // Remove real-time auth subscription to reduce database load
        // Auth state will be checked on-demand when needed
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('category_type')
                .not('category_type', 'is', null);

            if (!error && data) {
                const uniqueCategories = [...new Set(data.map(item => item.category_type))];
                setCategories(uniqueCategories);
            }
        };
        fetchCategories();
    }, []);

    const handleYouItemClick = (route) => {
        if (!user) {
            toast.error("Please login to access this feature");
            navigate("/UserRegister");
            return;
        }
        navigate(route);
    };

    const mainItems = [
        { title: "Home", icon: Home, active: true, to: "/" },
        { title: "pitch", icon: Scissors, to: "/approved-pitches" },
        { title: "Community", icon: Users, to: "/launchit-community" },
        { title: "You", icon: User, to: "/explore" },
    ];

    const youItems = [
        { title: "Your Launches", icon: Rocket, route: "/my-launches" },
        { title: "Saved Launches", icon: Bookmark, route: "/saved-projects" },
        { title: "Upvoted Launches", icon: ThumbsUp, route: "/upvoted-projects" },
        { title: "Viewed Launches", icon: History, route: "/viewed-history" },
        { title: "Your Comments", icon: MessageSquare, route: "/my-comments" },
        { title: "Connections", icon: Users, route: "/followers-following" },
    ];

    const displayedCategories = showMoreCategories ? categories : categories.slice(0, 5);

    if (!isOpen) {
        return (
            <aside className={`fixed left-0 top-14 w-16 h-[calc(100vh-64px)] bg-white overflow-y-auto  ${isProjectDetails ? 'z-50' : 'z-40'} hidden lg:block`}>
                <div className="p-2">
                    <div className="space-y-2">
                        {mainItems.map((item) => (
                            <Link
                                key={item.title}
                                to={item.to}
                                className={`w-full flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors ${item.active
                                    ? "bg-gray-100 text-black"
                                    : "text-black hover:bg-gray-100"
                                    }`}
                                title={item.title}
                            >
                                <item.icon className="w-5 h-5 mb-1" />
                            </Link>
                        ))}
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className={`fixed left-0 top-16 w-60 h-[calc(100vh-64px)] bg-white overflow-y-auto  ${isProjectDetails ? 'z-50' : 'z-40'}`}>
            <div className="">
                {/* Mobile Search Bar - Only visible when sidebar is open */}
                <div className="block lg:hidden p-4 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search startups, users, categories, tags..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            onChange={(e) => {
                                // Add AI search suggestions here
                                const query = e.target.value;
                                if (query.length >= 2) {
                                    // Generate AI suggestions
                                    const suggestions = [
                                        `Find ${query} alternatives`,
                                        `Best ${query} tools`,
                                        `${query} for startups`,
                                        `${query} solutions`
                                    ];
                                    // You can display these suggestions without changing existing logic
                                    console.log('AI suggestions:', suggestions);
                                }
                            }}
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                </div>

                {/* Main Navigation */}
                <div className="space-y-1 p-2">
                    {mainItems.map((item) => (
                        <Link
                            key={item.title}
                            to={item.to}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active
                                ? "bg-gray-100 text-black"
                                : "text-black hover:bg-gray-100"
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span>{item.title}</span>
                        </Link>
                    ))}
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200 my-3" />

                {/* You Section */}
                <div className="space-y-1">
                    <div className="flex items-center px-3 py-2 text-black font-medium text-base">
                        You
                        <ChevronRight className="ml-1 text-gray-500 w-4 h-4" />
                    </div>
                    {youItems.map((item) => (
                        <button
                            key={item.title}
                            onClick={() => handleYouItemClick(item.route)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-black hover:bg-gray-100 transition-colors"
                        >
                            <item.icon className="w-6 h-6" />
                            <span>{item.title}</span>
                        </button>
                    ))}
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200 my-3" />

                {/* Explore Section */}
                <div className="space-y-1">
                    <div className="px-3 py-2 text-black font-medium text-base">
                        Explore
                    </div>
                    {displayedCategories.map((category) => (
                        <Link
                            key={category}
                            to={`/category/${category}`}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-black hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">{category.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="capitalize">{category}</span>
                        </Link>
                    ))}
                    {categories.length > 5 && (
                        <button
                            onClick={() => setShowMoreCategories(!showMoreCategories)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <span className="w-6 h-6"></span>
                            <span>{showMoreCategories ? 'Show less' : 'Show more'}</span>
                        </button>
                    )}
                </div>

                {/* Footer Links */}
                <div className="border-t border-gray-200 my-3 pt-3">
                    <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex flex-wrap gap-2 px-3">
                            <a href="/terms" className="hover:text-gray-800">Terms</a>
                            <a href="/privacy" className="hover:text-gray-800">Privacy</a>

                        </div>
                        <div className="px-3">
                            <a href="/launchitguide" className="hover:text-gray-800">How launchit works</a>
                        </div>
                        <div className="px-3 pt-2 text-xs text-gray-500">
                            © 2025 launchit LLC
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar; 