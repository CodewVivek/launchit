import React from 'react';
import { CheckCircle } from 'lucide-react';
import { formatTimeAgo } from '../../utils/registerUtils';

const FormHeader = ({ user, isFormEmpty, formData, isAutoSaving, lastSavedAt, hasUnsavedChanges }) => {
    return (
        <header className="text-center py-8">
            <h1 className="text-3xl font-bold mb-2">Submit Your Launch</h1>
            <p className="text-gray-500 mt-2">
                Get your product in front of the right audience. Be seen, gain traction, and grow with confidence!
            </p>
            {/* Auto-save indicator */}
            {user && !isFormEmpty() && formData.name && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                    {isAutoSaving ? (
                        <span className="text-blue-600 flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            Saving...
                        </span>
                    ) : lastSavedAt ? (
                        <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Auto-saved {formatTimeAgo(lastSavedAt)}
                        </span>
                    ) : hasUnsavedChanges ? (
                        <span className="text-gray-500">Changes will be auto-saved...</span>
                    ) : null}
                </div>
            )}
        </header>
    );
};

export default FormHeader;

