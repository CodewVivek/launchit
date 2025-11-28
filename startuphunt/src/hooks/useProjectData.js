import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { loadProjectForEditing } from '../utils/projectLoading';
import categoryOptions from '../Components/categoryOptions';

export const useProjectData = (user, searchParams, projectLoaded, setSnackbar) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [loadingProject, setLoadingProject] = useState(false);
    const [editingLaunched, setEditingLaunched] = useState(false);
    const [existingMediaUrls, setExistingMediaUrls] = useState([]);
    const [existingLogoUrl, setExistingLogoUrl] = useState('');

    useEffect(() => {
        const editId = searchParams.get('edit');
        const draftId = searchParams.get('draft');
        const projectId = editId || draftId;
        if (user && !projectLoaded && projectId) {
            loadProjectForEditing({
                projectId,
                user,
                supabase,
                setLoadingProject,
                setIsEditing,
                setEditingProjectId,
                setEditingLaunched,
                setFormData: (data) => {}, // Will be set by parent
                setSelectedCategory: (cat) => {}, // Will be set by parent
                setLinks: (links) => {}, // Will be set by parent
                setBuiltWith: (built) => {}, // Will be set by parent
                setTags: (tags) => {}, // Will be set by parent
                setExistingMediaUrls,
                setExistingLogoUrl,
                setLogoFile: (file) => {}, // Will be set by parent
                setThumbnailFile: (file) => {}, // Will be set by parent
                setCoverFiles: (files) => {}, // Will be set by parent
                setAutoSaveDraftId: (id) => {}, // Will be set by parent
                setHasUnsavedChanges: (val) => {}, // Will be set by parent
                setProjectLoaded: (val) => {}, // Will be set by parent
                setSnackbar,
            });
        }
    }, [user, projectLoaded, searchParams]);

    return {
        isEditing,
        setIsEditing,
        editingProjectId,
        setEditingProjectId,
        loadingProject,
        editingLaunched,
        existingMediaUrls,
        setExistingMediaUrls,
        existingLogoUrl,
        setExistingLogoUrl,
    };
};

