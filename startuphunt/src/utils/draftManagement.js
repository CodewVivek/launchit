import { slugify } from './registerUtils';
import { nanoid } from 'nanoid';

export const handleAutoSaveDraft = async ({
    user,
    isEditing,
    isFormEmpty,
    formData,
    isAutoSaving,
    autoSaveDraftId,
    editingProjectId,
    selectedCategory,
    links,
    builtWith,
    tags,
    existingMediaUrls,
    logoFile,
    thumbnailFile,
    coverFiles,
    supabase,
    setAutoSaveDraftId,
    setIsAutoSaving,
    setHasUnsavedChanges,
    setLastSavedAt,
}) => {
    if (!user || isEditing || isFormEmpty() || !formData.name || isAutoSaving) {
        return;
    }

    setIsAutoSaving(true);
    try {
        let draftId = autoSaveDraftId || editingProjectId;

        // Check if draft with same name exists
        if (!draftId) {
            const { data: existingDraft } = await supabase
                .from('projects')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', formData.name)
                .eq('status', 'draft')
                .maybeSingle();
            if (existingDraft && existingDraft.id) {
                draftId = existingDraft.id;
                setAutoSaveDraftId(draftId);
            }
        }

        const draftData = {
            name: formData.name,
            website_url: formData.websiteUrl || '',
            tagline: formData.tagline || '',
            description: formData.description || '',
            category_type: selectedCategory?.value || '',
            links: links.filter(link => link.trim() !== ''),
            built_with: builtWith.map(item => item.value),
            tags: tags,
            updated_at: new Date().toISOString(),
            user_id: user.id,
            status: 'draft',
            media_urls: [...existingMediaUrls],
            logo_url: typeof logoFile === 'string' ? logoFile : null,
            thumbnail_url: typeof thumbnailFile === 'string' ? thumbnailFile : null,
            cover_urls: coverFiles.filter(f => typeof f === 'string'),
        };

        // Only set created_at and slug for new drafts
        if (!draftId) {
            draftData.created_at = new Date().toISOString();
            draftData.slug = slugify(formData.name) + '-' + nanoid(6);
        }

        if (draftId) {
            await supabase.from('projects').update(draftData).eq('id', draftId);
        } else {
            const { data: newDraft } = await supabase.from('projects').insert([draftData]).select('id').single();
            if (newDraft) {
                setAutoSaveDraftId(newDraft.id);
            }
        }

        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
    } catch (error) {
        console.error('Auto-save failed:', error);
        // Silent fail - don't show error to user
    } finally {
        setIsAutoSaving(false);
    }
};

export const handleSaveDraft = async ({
    user,
    isFormEmpty,
    isEditing,
    editingLaunched,
    formData,
    autoSaveDraftId,
    editingProjectId,
    selectedCategory,
    links,
    builtWith,
    tags,
    existingMediaUrls,
    logoFile,
    thumbnailFile,
    coverFiles,
    supabase,
    setAutoSaveDraftId,
    setHasUnsavedChanges,
    setLastSavedAt,
    setSnackbar,
    navigate,
}) => {
    if (!user) {
        setSnackbar({ open: true, message: 'Please sign in to save', severity: 'warning' });
        navigate('/UserRegister');
        return;
    }
    if (isFormEmpty()) {
        setSnackbar({ open: true, message: 'Cannot save an empty draft.', severity: 'warning' });
        return;
    }
    if (isEditing && editingLaunched) {
        setSnackbar({ open: true, message: 'Cannot save launched project as draft.', severity: 'warning' });
        return;
    }
    if (!formData.name) {
        setSnackbar({ open: true, message: 'Please enter a project name before saving.', severity: 'warning' });
        return;
    }
    let draftId = autoSaveDraftId || editingProjectId;
    if (!isEditing && !draftId) {
        const { data: existingDraft } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', formData.name)
            .eq('status', 'draft')
            .maybeSingle();
        if (existingDraft && existingDraft.id) {
            draftId = existingDraft.id;
            setAutoSaveDraftId(draftId);
        }
    }
    const draftData = {
        name: formData.name,
        website_url: formData.websiteUrl || '',
        tagline: formData.tagline || '',
        description: formData.description || '',
        category_type: selectedCategory?.value || '',
        links: links.filter(link => link.trim() !== ''),
        built_with: builtWith.map(item => item.value),
        tags: tags,
        created_at: new Date().toISOString(),
        user_id: user.id,
        status: 'draft',
        slug: slugify(formData.name) + '-' + nanoid(6),
        media_urls: [...existingMediaUrls],
        logo_url: typeof logoFile === 'string' ? logoFile : null,
        thumbnail_url: typeof thumbnailFile === 'string' ? thumbnailFile : null,
        cover_urls: coverFiles.filter(f => typeof f === 'string'),
    };
    try {
        if (draftId) {
            await supabase.from('projects').update(draftData).eq('id', draftId);
        } else {
            const { data: newDraft } = await supabase.from('projects').insert([draftData]).select('id').single();
            if (newDraft) {
                setAutoSaveDraftId(newDraft.id);
            }
        }
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        setSnackbar({ open: true, message: 'Launch saved!', severity: 'success' });
    } catch (error) {
        setSnackbar({ open: true, message: 'Failed to save draft. Please try again.', severity: 'error' });
    }
};

