import React, { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { Snackbar, Alert } from "@mui/material";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        async function fetchUser() {
            const { data } = await supabase.auth.getUser();
            setUser(data?.user || null);
        }
        fetchUser();
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Set up real-time subscription for new notifications
            const subscription = supabase
                .channel("notifications")
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        setNotifications((prev) => [payload.new, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                    },
                )
                .subscribe();

            return () => subscription.unsubscribe();
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.read).length);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", notificationId);

            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === notificationId ? { ...notif, read: true } : notif,
                ),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
            setSnackbar({
                open: true,
                message: "Error marking notification as read",
                severity: "error",
            });
        }
    };

    const markAllAsRead = async () => {
        try {
            await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);

            setNotifications((prev) =>
                prev.map((notif) => ({ ...notif, read: true })),
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            setSnackbar({
                open: true,
                message: "Error marking notifications as read",
                severity: "error",
            });
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "pitch_approved":
                return "✅";
            case "pitch_rejected":
                return "❌";
            case "project_like":
                return "❤️";
            case "project_comment":
                return "💬";
            default:
                return "🔔";
        }
    };

    const getNotificationText = (notification) => {
        switch (notification.type) {
            case "pitch_approved":
                return `Your pitch "${notification.title}" has been approved!`;
            case "pitch_rejected":
                return `Your pitch "${notification.title}" was not approved.`;
            case "project_like":
                return `Someone liked your project "${notification.project_name}"`;
            case "project_comment":
                return `New comment on your project "${notification.project_name}"`;
            default:
                return notification.message || "New notification";
        }
    };

    if (!user) return null;

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getNotificationIcon(notification.type)}
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {getNotificationText(notification)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(
                                                        notification.created_at,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MUI Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
