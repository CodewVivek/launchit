import React, { useState, useEffect } from 'react';
import { moderateContent } from '../utils/aiApi';
import { toast } from 'react-hot-toast';

const ContentModeration = ({
    content,
    contentType,
    userId,
    onModerationComplete,
    showAlert = true,
    className = ""
}) => {
    const [isModerating, setIsModerating] = useState(false);
    const [moderationResult, setModerationResult] = useState(null);
    const [showRejectionAlert, setShowRejectionAlert] = useState(false);

    // Auto-moderate content when it changes
    useEffect(() => {
        if (content && content.trim().length > 0) {
            handleModeration();
        }
    }, [content]);

    const handleModeration = async () => {
        if (!content || !contentType || !userId) return;

        setIsModerating(true);
        try {
            const result = await moderateContent(content, contentType, userId);
            setModerationResult(result);

            // Handle different moderation actions
            if (result.action === 'reject') {
                // Show rejection alert to user
                if (showAlert) {
                    setShowRejectionAlert(true);
                    toast.error('Content rejected - violates community guidelines');
                }

                // Report to admin automatically
                reportToAdmin(result);

            } else if (result.action === 'review') {
                // Content flagged for review
                if (showAlert) {
                    toast('Content flagged for review - will be checked shortly', { icon: '⚠️' });
                }

            } else if (result.action === 'approve') {
                // Content approved
                if (showAlert) {
                    toast.success('Content approved!');
                }
            }

            // Call parent callback
            if (onModerationComplete) {
                onModerationComplete(result);
            }

        } catch (error) {
            console.error('Moderation failed:', error);
            toast.error('Content moderation failed - please try again');
        } finally {
            setIsModerating(false);
        }
    };

    const reportToAdmin = (result) => {
        // This automatically happens in the backend when content is rejected
        // The backend stores the rejection in the content_moderation table
        // Admins can see this in their moderation dashboard
            content: content.substring(0, 100) + '...',
            contentType,
            userId,
            reason: result.moderationResult.issues.join(', '),
            timestamp: new Date().toISOString()
        });
    };

    const getModerationStatus = () => {
        if (!moderationResult) return null;

        switch (moderationResult.action) {
            case 'approve':
                return {
                    status: 'approved',
                    color: 'text-green-600',
                    icon: '✅',
                    message: 'Content approved'
                };
            case 'review':
                return {
                    status: 'review',
                    color: 'text-yellow-600',
                    icon: '⚠️',
                    message: 'Content under review'
                };
            case 'reject':
                return {
                    status: 'rejected',
                    color: 'text-red-600',
                    icon: '❌',
                    message: 'Content rejected'
                };
            default:
                return null;
        }
    };

    const getModerationIssues = () => {
        if (!moderationResult?.moderationResult?.issues) return [];
        return moderationResult.moderationResult.issues;
    };

    const getModerationRecommendations = () => {
        if (!moderationResult?.moderationResult?.recommendations) return [];
        return moderationResult.moderationResult.recommendations;
    };

    const status = getModerationStatus();

    return (
        <div className={`content-moderation ${className}`}>
            {/* Moderation Status Indicator */}
            {status && (
                <div className={`flex items-center gap-2 text-sm ${status.color}`}>
                    <span className="text-lg">{status.icon}</span>
                    <span className="font-medium">{status.message}</span>
                    {isModerating && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    )}
                </div>
            )}

            {/* Rejection Alert Modal */}
            {showRejectionAlert && moderationResult?.action === 'reject' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">❌</span>
                            <h3 className="text-lg font-semibold text-red-600">
                                Content Rejected
                            </h3>
                        </div>

                        <div className="mb-4">
                            <p className="text-gray-700 mb-3">
                                Your content has been rejected because it violates our community guidelines.
                            </p>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                <h4 className="font-medium text-red-800 mb-2">Issues Found:</h4>
                                <ul className="text-sm text-red-700 space-y-1">
                                    {getModerationIssues().map((issue, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-red-500 mt-1">•</span>
                                            <span>{issue}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <h4 className="font-medium text-blue-800 mb-2">How to Fix:</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    {getModerationRecommendations().map((rec, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-1">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-600 mt-1">ℹ️</span>
                                <div className="text-sm text-yellow-800">
                                    <p className="font-medium">This has been reported to our admin team.</p>
                                    <p>Please review our community guidelines and edit your content accordingly.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectionAlert(false)}
                                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                I Understand
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectionAlert(false);
                                    // You can add navigation to guidelines here
                                    window.open('/guidelines', '_blank');
                                }}
                                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                View Guidelines
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentModeration; 