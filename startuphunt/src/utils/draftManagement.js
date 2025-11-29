import { slugify } from './registerUtils';
import { nanoid } from 'nanoid';

/**
 * Auto-save a draft (silent, non-blocking) with retry mechanism.
 * Returns true on success, false on failure (useful if caller wants to know).
 */
export const handleAutoSaveDraft = async ({
  user,
  isEditing,
  isFormEmpty,
  formData,
  isAutoSaving,
  autoSaveDraftId,
  editingProjectId,
  selectedCategory,
  links = [],
  builtWith = [],
  tags = [],
  existingMediaUrls = [],
  logoFile,
  thumbnailFile,
  coverFiles = [],
  supabase,
  setAutoSaveDraftId,
  setIsAutoSaving,
  setHasUnsavedChanges,
  setLastSavedAt,
}, retryCount = 0) => {
  // guard conditions
  if (!user || isEditing || isFormEmpty?.() || !formData?.name || isAutoSaving) {
    return false;
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [2000, 5000, 10000]; // 2s, 5s, 10s

  setIsAutoSaving(true);
  try {
    let draftId = autoSaveDraftId || editingProjectId;

    // If we don't have a draft id, try to find an existing draft with same name
    if (!draftId) {
      const { data: existingDraft, error: findErr } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', formData.name)
        .eq('status', 'draft')
        .maybeSingle();

      if (findErr) {
        console.error('Error checking existing draft (auto-save):', findErr);
      } else if (existingDraft?.id) {
        draftId = existingDraft.id;
        if (typeof setAutoSaveDraftId === 'function') setAutoSaveDraftId(draftId);
      }
    }

    // defensive defaults
    const safeLinks = Array.isArray(links) ? links : [];
    const safeBuiltWith = Array.isArray(builtWith) ? builtWith : [];
    const safeTags = Array.isArray(tags) ? tags : [];
    const safeExistingMedia = Array.isArray(existingMediaUrls) ? existingMediaUrls : [];
    const safeCoverFiles = Array.isArray(coverFiles) ? coverFiles : [];

    const draftData = {
      name: formData.name,
      website_url: formData.websiteUrl || '',
      tagline: formData.tagline || '',
      description: formData.description || '',
      category_type: selectedCategory?.value || '',
      links: safeLinks.filter(l => typeof l === 'string' && l.trim() !== ''),
      built_with: safeBuiltWith.map(item => item?.value).filter(Boolean),
      tags: safeTags,
      updated_at: new Date().toISOString(),
      user_id: user.id,
      status: 'draft',
      media_urls: [...safeExistingMedia],
      logo_url: typeof logoFile === 'string' ? logoFile : null,
      thumbnail_url: typeof thumbnailFile === 'string' ? thumbnailFile : null,
      cover_urls: safeCoverFiles.filter(f => typeof f === 'string'),
    };

    // For auto-save, only set created_at & slug when creating NEW draft (not when updating)
    if (!draftId) {
      draftData.created_at = new Date().toISOString();
      draftData.slug = slugify(formData.name) + '-' + nanoid(6);
    }

    if (draftId) {
      const { error: updateErr } = await supabase
        .from('projects')
        .update(draftData)
        .eq('id', draftId);

      if (updateErr) {
        console.error('Auto-save update error:', updateErr);
        throw updateErr;
      }
    } else {
      const { data: newDraft, error: insertErr } = await supabase
        .from('projects')
        .insert([draftData])
        .select('id')
        .single();

      if (insertErr) {
        console.error('Auto-save insert error:', insertErr);
        throw insertErr;
      }
      if (newDraft?.id && typeof setAutoSaveDraftId === 'function') {
        setAutoSaveDraftId(newDraft.id);
      }
    }

    if (typeof setHasUnsavedChanges === 'function') setHasUnsavedChanges(false);
    if (typeof setLastSavedAt === 'function') setLastSavedAt(new Date());
    return true;
  } catch (err) {
    console.error('Auto-save exception:', err);
    
    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount] || 10000;
      console.log(`Auto-save failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with incremented count
      return handleAutoSaveDraft({
        user,
        isEditing,
        isFormEmpty,
        formData,
        isAutoSaving: false, // Reset flag for retry
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
      }, retryCount + 1);
    }
    
    // All retries exhausted
    return false;
  } finally {
    if (typeof setIsAutoSaving === 'function') setIsAutoSaving(false);
  }
};


/**
 * Save draft explicitly (shows snackbar feedback to user).
 */
export const handleSaveDraft = async ({
  user,
  isFormEmpty,
  isEditing,
  editingLaunched,
  formData,
  autoSaveDraftId,
  editingProjectId,
  selectedCategory,
  links = [],
  builtWith = [],
  tags = [],
  existingMediaUrls = [],
  logoFile,
  thumbnailFile,
  coverFiles = [],
  supabase,
  setAutoSaveDraftId,
  setHasUnsavedChanges,
  setLastSavedAt,
  setSnackbar,
  navigate,
}) => {
  // Auth guard
  if (!user) {
    setSnackbar?.({ open: true, message: 'Please sign in to save', severity: 'warning' });
    navigate?.('/UserRegister');
    return false;
  }

  // Form validation
  if (isFormEmpty?.()) {
    setSnackbar?.({ open: true, message: 'Cannot save an empty draft.', severity: 'warning' });
    return false;
  }
  if (isEditing && editingLaunched) {
    setSnackbar?.({ open: true, message: 'Cannot save launched project as draft.', severity: 'warning' });
    return false;
  }
  if (!formData?.name) {
    setSnackbar?.({ open: true, message: 'Please enter a project name before saving.', severity: 'warning' });
    return false;
  }

  // Find existing draft id if needed
  let draftId = autoSaveDraftId || editingProjectId;
  if (!isEditing && !draftId) {
    try {
      const { data: existingDraft, error: findErr } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', formData.name)
        .eq('status', 'draft')
        .maybeSingle();

      if (findErr) {
        console.error('Error checking existing draft (manual save):', findErr);
      } else if (existingDraft?.id) {
        draftId = existingDraft.id;
        if (typeof setAutoSaveDraftId === 'function') setAutoSaveDraftId(draftId);
      }
    } catch (err) {
      console.error('Exception checking existing draft (manual save):', err);
    }
  }

  // Defensive defaults
  const safeLinks = Array.isArray(links) ? links : [];
  const safeBuiltWith = Array.isArray(builtWith) ? builtWith : [];
  const safeTags = Array.isArray(tags) ? tags : [];
  const safeExistingMedia = Array.isArray(existingMediaUrls) ? existingMediaUrls : [];
  const safeCoverFiles = Array.isArray(coverFiles) ? coverFiles : [];

  // Only set created_at & slug for NEW drafts
  const draftData = {
    name: formData.name,
    website_url: formData.websiteUrl || '',
    tagline: formData.tagline || '',
    description: formData.description || '',
    category_type: selectedCategory?.value || '',
    links: safeLinks.filter(l => typeof l === 'string' && l.trim() !== ''),
    built_with: safeBuiltWith.map(item => item?.value).filter(Boolean),
    tags: safeTags,
    user_id: user.id,
    status: 'draft',
    media_urls: [...safeExistingMedia],
    logo_url: typeof logoFile === 'string' ? logoFile : null,
    thumbnail_url: typeof thumbnailFile === 'string' ? thumbnailFile : null,
    cover_urls: safeCoverFiles.filter(f => typeof f === 'string'),
    updated_at: new Date().toISOString(),
  };

  if (!draftId) {
    draftData.created_at = new Date().toISOString();
    draftData.slug = slugify(formData.name) + '-' + nanoid(6);
  }

  try {
    if (draftId) {
      const { error: updateErr } = await supabase
        .from('projects')
        .update(draftData)
        .eq('id', draftId);

      if (updateErr) throw updateErr;
    } else {
      const { data: newDraft, error: insertErr } = await supabase
        .from('projects')
        .insert([draftData])
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      if (newDraft?.id && typeof setAutoSaveDraftId === 'function') {
        setAutoSaveDraftId(newDraft.id);
      }
    }

    setHasUnsavedChanges?.(false);
    setLastSavedAt?.(new Date());
    setSnackbar?.({ open: true, message: 'Launch saved!', severity: 'success' });
    return true;
  } catch (error) {
    console.error('Failed to save draft:', error);
    setSnackbar?.({ open: true, message: 'Failed to save draft. Please try again.', severity: 'error' });
    return false;
  }
};
