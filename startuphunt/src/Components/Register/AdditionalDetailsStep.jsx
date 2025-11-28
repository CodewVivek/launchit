import React from 'react';
import { X } from 'lucide-react';
import BuiltWithSelect from '../BuiltWithSelect';
import LinksManager from './LinksManager';
import { customSelectStyles } from '../../constants/selectStyles';

const AdditionalDetailsStep = ({
    links,
    updateLink,
    addLink,
    removeLink,
    builtWith,
    setBuiltWith,
    tags,
    setTags,
}) => {
    return (
        <div className="form-tab-panel active">
            <div className="space-y-6">
                <div className="space-y-4">
                    <LinksManager
                        links={links}
                        updateLink={updateLink}
                        addLink={addLink}
                        removeLink={removeLink}
                    />
                    <div>
                        <BuiltWithSelect value={builtWith} onChange={setBuiltWith} styles={customSelectStyles} className="mt-2" />
                    </div>
                    <div>
                        <label className="form-label">Tags</label>
                        <div className="space-y-2 mt-2">
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, index) => (
                                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Add tags (press Enter to add)"
                                className="form-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        e.preventDefault();
                                        const newTag = e.target.value.trim();
                                        if (!tags.includes(newTag)) {
                                            setTags([...tags, newTag]);
                                        }
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <div className="text-sm text-gray-500">
                                AI-generated tags appear here. You can remove them or add your own.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdditionalDetailsStep;

