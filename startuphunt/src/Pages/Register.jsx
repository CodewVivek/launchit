// src/pages/Register.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../Components/SEO';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import categoryOptions from '../Components/categoryOptions';
import DraftSelectionScreen from '../Components/DraftSelectionScreen';
import { optimizeImage } from '../utils/imageOptimizer';
import { isValidUrl } from '../utils/registerUtils';
import BasicInfoStep from '../Components/Register/BasicInfoStep';
import MediaStep from '../Components/Register/MediaStep';
import AdditionalDetailsStep from '../Components/Register/AdditionalDetailsStep';
import SmartFillDialog from '../Components/Register/SmartFillDialog';
import FormTabs from '../Components/Register/FormTabs';
import FormActions from '../Components/Register/FormActions';
import FormHeader from '../Components/Register/FormHeader';
import '../styles/registerForm.css';
import { validateForm, isFormEmpty, getFilledFieldsCount } from '../utils/formValidation';
import { handleFormSubmission } from '../utils/formSubmission';
import { generateLaunchData } from '../utils/aiGeneration';
import { applyAIData } from '../utils/aiDataApplication';
import { generateBasicPreview } from '../utils/urlPreview';
import { loadProjectForEditing } from '../utils/projectLoading';
import { handleAutoSaveDraft, handleSaveDraft } from '../utils/draftManagement';
import { handleContinueDraft, handleStartNew } from '../utils/draftHandlers';
import { viewAIImage, handleImageError } from '../utils/imageHelpers';
import { handleSmartFillAll, handleSmartFillEmpty, handleSmartFillCancel } from '../utils/smartFillHandlers';

const Register = () => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Auth & user
    const [user, setUser] = useState(null);

    // Form state
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        websiteUrl: '',
        description: '',
        tagline: '',
        categoryOptions: '',
    });
    const [links, setLinks] = useState(['']);
    const [builtWith, setBuiltWith] = useState([]);
    const [tags, setTags] = useState([]);
    const [logoFile, setLogoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [coverFiles, setCoverFiles] = useState([null, null, null, null]);

    const [dynamicCategoryOptions, setDynamicCategoryOptions] = useState(categoryOptions);

    // UI / helper state
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [urlError, setUrlError] = useState('');
    const [descriptionWordCount, setDescriptionWordCount] = useState(0);
    const [taglineCharCount, setTaglineCharCount] = useState(0);
    const DESCRIPTION_WORD_LIMIT = 260;

    // Editing / project load
    const [isEditing, setIsEditing] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editingLaunched, setEditingLaunched] = useState(false);
    const [projectLoaded, setProjectLoaded] = useState(false);
    const [loadingProject, setLoadingProject] = useState(false);

    const [existingMediaUrls, setExistingMediaUrls] = useState([]);
    const [existingLogoUrl, setExistingLogoUrl] = useState('');

    // Draft selection state (parent owns drafts)
    const [showDraftSelection, setShowDraftSelection] = useState(false);
    const [userDrafts, setUserDrafts] = useState([]);
    const [loadingDrafts, setLoadingDrafts] = useState(false);

    // Auto-save state
    const [autoSaveDraftId, setAutoSaveDraftId] = useState(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [autoSaveError, setAutoSaveError] = useState(null);

    // AI / smart-fill state
    const [showSmartFillDialog, setShowSmartFillDialog] = useState(false);
    const [pendingAIData, setPendingAIData] = useState(null);
    const [isAILoading, setIsAILoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    // URL preview
    const [urlPreview, setUrlPreview] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    // Misc refs
    const mountedRef = useRef(true);
    const autoSaveTimerRef = useRef(null);

    // derive primitive params (avoid URLSearchParams identity change)
    const editParam = searchParams.get('edit');
    const draftParam = searchParams.get('draft');

    //
    // ------------- Auth check (safe) -------------
    //
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (!mountedRef.current) return;
                if (error) {
                    console.error('Error fetching auth user:', error);
                    setSnackbar({ open: true, message: 'Authentication error. Please refresh and try again.', severity: 'error' });
                    navigate('/UserRegister');
                    return;
                }
                const currentUser = data?.user || null;
                if (!mountedRef.current) return;
                if (!currentUser) {
                    setSnackbar({ open: true, message: 'Please sign in to submit a project', severity: 'warning' });
                    navigate('/UserRegister');
                    return;
                }
                setUser(currentUser);
            } catch (err) {
                if (!mountedRef.current) return;
                console.error('Unexpected error fetching auth user:', err);
                setSnackbar({ open: true, message: 'Authentication error. Please refresh and try again.', severity: 'error' });
                navigate('/UserRegister');
            }
        };
        checkUser();
    }, [navigate, supabase]);

    //
    // ------------- Draft fetching (parent) -------------
    //
    useEffect(() => {
        const fetchUserDrafts = async () => {
            if (!user) return;
            // if editing or explicit draft param present, don't show the draft-selection prompt
            if (editParam || draftParam) return;

            setLoadingDrafts(true);
            try {
                const { data: drafts, error } = await supabase
                    .from('projects')
                    .select('id, name, website_url, tagline, description, category_type, created_at, updated_at, logo_url, thumbnail_url')
                    .eq('user_id', user.id)
                    .eq('status', 'draft')
                    .order('updated_at', { ascending: false });

                if (!mountedRef.current) return;

                if (error) {
                    console.error('Error fetching drafts:', error);
                    setUserDrafts([]);
                } else {
                    const meaningfulDrafts = (drafts || []).filter(draft =>
                        draft.name || draft.website_url || draft.tagline || draft.description || draft.category_type
                    );
                    if (!mountedRef.current) return;
                    setUserDrafts(meaningfulDrafts);
                    if (meaningfulDrafts.length > 0) {
                        setShowDraftSelection(true);
                    }
                }
            } catch (err) {
                if (!mountedRef.current) return;
                console.error('Error fetching drafts (catch):', err);
                setUserDrafts([]);
            } finally {
                if (mountedRef.current) {
                    setLoadingDrafts(false);
                }
            }
        };

        if (user && !projectLoaded) {
            fetchUserDrafts();
        }
    }, [user, projectLoaded, editParam, draftParam, supabase]);

    //
    // ------------- Load project for editing -------------
    //
    useEffect(() => {
        const projectId = editParam || draftParam;
        if (!projectId || !user || projectLoaded) return;

        const load = async () => {
            try {
                setLoadingProject(true);
                await loadProjectForEditing({
                    projectId,
                    user,
                    supabase,
                    setLoadingProject,
                    setIsEditing,
                    setEditingProjectId,
                    setEditingLaunched,
                    setFormData,
                    setSelectedCategory,
                    setLinks,
                    setBuiltWith,
                    setTags,
                    setExistingMediaUrls,
                    setExistingLogoUrl,
                    setLogoFile,
                    setThumbnailFile,
                    setCoverFiles,
                    setAutoSaveDraftId,
                    setHasUnsavedChanges,
                    setProjectLoaded,
                    setSnackbar,
                });
            } catch (err) {
                if (!mountedRef.current) return;
                console.error('Failed to load project for editing:', err);
            } finally {
                if (!mountedRef.current) return;
                setLoadingProject(false);
            }
        };

        load();
    }, [user, projectLoaded, editParam, draftParam, supabase]);

    //
    // ------------- Form helpers -------------
    //
    const handleUrlBlur = (e) => {
        const { value } = e.target;
        if (value && !isValidUrl(value)) setUrlError('Please enter a valid URL (e.g., https://example.com)');
        else setUrlError('');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (projectLoaded) setHasUnsavedChanges(true);
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        const words = value.trim().split(/\s+/).filter(Boolean);
        if (words.length <= DESCRIPTION_WORD_LIMIT) {
            setFormData(prev => ({ ...prev, description: value }));
            setDescriptionWordCount(words.length);
        } else {
            const limited = words.slice(0, DESCRIPTION_WORD_LIMIT).join(' ');
            setFormData(prev => ({ ...prev, description: limited }));
            setDescriptionWordCount(DESCRIPTION_WORD_LIMIT);
        }
        if (projectLoaded) setHasUnsavedChanges(true);
    };

    const handleTaglineChange = (e) => {
        const val = e.target.value.slice(0, 60);
        setFormData(prev => ({ ...prev, tagline: val }));
        setTaglineCharCount(val.length);
        if (projectLoaded) setHasUnsavedChanges(true);
    };

    const addLink = () => {
        setLinks(prev => ([...prev, '']));
        if (projectLoaded) setHasUnsavedChanges(true);
    };
    const updateLink = (index, value) => {
        setLinks(prev => prev.map((l, i) => (i === index ? value : l)));
        if (projectLoaded) setHasUnsavedChanges(true);
    };
    const removeLink = (index) => {
        setLinks(prev => prev.filter((_, i) => i !== index));
        if (projectLoaded) setHasUnsavedChanges(true);
    };

    const handleLogoChange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const optimizedFile = await optimizeImage(file, 'logo');
                setLogoFile(optimizedFile);
                if (projectLoaded) setHasUnsavedChanges(true);
            } catch {
                setLogoFile(file);
                if (projectLoaded) setHasUnsavedChanges(true);
            } finally {
                setIsUploading(false);
            }
        }
    };
    const removeLogo = () => {
        setLogoFile(null);
        if (projectLoaded) setHasUnsavedChanges(true);
    };

    const handleThumbnailChange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const optimizedFile = await optimizeImage(file, 'thumbnail');
                setThumbnailFile(optimizedFile);
                if (projectLoaded) setHasUnsavedChanges(true);
            } catch {
                setThumbnailFile(file);
                if (projectLoaded) setHasUnsavedChanges(true);
            } finally {
                setIsUploading(false);
            }
        }
    };
    const removeThumbnail = () => {
        setThumbnailFile(null);
        if (projectLoaded) setHasUnsavedChanges(true);
    };

    const handleCoverChange = async (e, idx) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const optimizedFile = await optimizeImage(file, 'cover');
                setCoverFiles(prev => prev.map((f, i) => (i === idx ? optimizedFile : f)));
                if (projectLoaded) setHasUnsavedChanges(true);
            } catch {
                setCoverFiles(prev => prev.map((f, i) => (i === idx ? file : f)));
                if (projectLoaded) setHasUnsavedChanges(true);
            } finally {
                setIsUploading(false);
            }
        }
    };
    const removeCover = (idx) => {
        setCoverFiles(prev => prev.map((f, i) => (i === idx ? null : f)));
        if (projectLoaded) setHasUnsavedChanges(true);
    };

    //
    // ------------- AI / Smart Fill -------------
    //
    const handleGenerateLaunchData = async (isRetry = false) => {
        await generateLaunchData({
            websiteUrl: formData.websiteUrl,
            supabase,
            setSnackbar,
            setIsAILoading,
            setIsRetrying,
            setRetryCount,
            retryCount,
            isRetry,
            formData,
            getFilledFieldsCount: () => getFilledFieldsCount(formData, selectedCategory, logoFile, thumbnailFile, coverFiles, tags, links, builtWith),
            applyAIData: (gptData, onlyEmptyFields) => applyAIData({
                gptData,
                onlyEmptyFields,
                setFormData,
                setLinks,
                links,
                setLogoFile,
                logoFile,
                setThumbnailFile,
                thumbnailFile,
                setTags,
                tags,
                setSelectedCategory,
                selectedCategory,
                dynamicCategoryOptions,
                setDynamicCategoryOptions,
            }),
            setPendingAIData,
            setShowSmartFillDialog,
            urlPreview,
            isGeneratingPreview,
            generateBasicPreview: (url) => generateBasicPreview(url, setUrlPreview, setIsGeneratingPreview, setSnackbar),
        });
    };

    //
    // ------------- Submit & Save -------------
    //
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm(formData, selectedCategory, coverFiles, logoFile, thumbnailFile, urlPreview, setSnackbar)) return;
        if (!user) {
            setSnackbar({ open: true, message: 'Please sign in to submit a project', severity: 'error' });
            navigate('/UserRegister');
            return;
        }

        await handleFormSubmission({
            formData,
            selectedCategory,
            links,
            builtWith,
            tags,
            logoFile,
            thumbnailFile,
            coverFiles,
            existingMediaUrls,
            existingLogoUrl,
            isEditing,
            editingProjectId,
            user,
            supabase,
            setSnackbar,
            navigate,
            setFormData,
            setSelectedCategory,
            setLinks,
            setTags,
            setLogoFile,
            setThumbnailFile,
            setCoverFiles,
            setEditingProjectId,
            setUrlPreview,
            setPendingAIData,
            setShowSmartFillDialog,
            setRetryCount,
            setIsAILoading,
            setIsRetrying,
            setIsGeneratingPreview,
        });
    };

    const handleSaveDraftClick = async () => {
        await handleSaveDraft({
            user,
            isFormEmpty: () => isFormEmpty(formData, selectedCategory),
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
        });
    };

    //
    // ------------- Parent-owned delete (safe) -------------
    //
    const handleDeleteDraft = async (draftId) => {
        if (!draftId || !user) return;
        setLoadingDrafts(true);
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', draftId)
                .eq('user_id', user.id)
                .eq('status', 'draft');

            if (error) throw error;

            setUserDrafts(prev => {
                const next = prev.filter(d => d.id !== draftId);
                if (next.length === 0) {
                    // close draft selection and open blank submit page
                    setShowDraftSelection(false);
                    navigate('/submit');
                }
                return next;
            });

            setSnackbar({ open: true, message: 'Draft deleted successfully', severity: 'success' });
        } catch (err) {
            console.error('Failed to delete draft:', err);
            setSnackbar({ open: true, message: 'Failed to delete draft', severity: 'error' });
        } finally {
            setLoadingDrafts(false);
        }
    };

    //
    // ------------- Autosave (debounced + mounted guard) -------------
    //
    // Compact form trigger — include only meaningful fields to avoid over-triggering
    const formTrigger = [
        formData?.name,
        formData?.websiteUrl,
        formData?.tagline,
        formData?.description?.slice(0, 200),
        selectedCategory?.value,
        links.length,
        builtWith.length,
        tags.length,
        existingMediaUrls.length,
        Boolean(logoFile),
        Boolean(thumbnailFile),
        coverFiles.length,
        hasUnsavedChanges,
        isEditing,
        projectLoaded,
    ].join('|');

    useEffect(() => {
        if (!mountedRef.current) return;
        // guards
        if (!user || isEditing || isAutoSaving) return;
        if (!formData?.name) return;
        if (isFormEmpty(formData, selectedCategory)) return;
        if (isUploading) return; // Don't autosave while files are uploading

        // CRITICAL: Only autosave when there are actual unsaved changes
        if (!hasUnsavedChanges) return;

        // Skip if project was loaded and no changes detected
        if (projectLoaded && !hasUnsavedChanges) return;

        // clear previous timer
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        autoSaveTimerRef.current = setTimeout(async () => {
            if (!mountedRef.current) return;
            const success = await handleAutoSaveDraft({
                user,
                isEditing,
                isFormEmpty: () => isFormEmpty(formData, selectedCategory),
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
            });
            if (!mountedRef.current) return;
            if (!success) {
                setAutoSaveError('Auto-save failed. Click to retry.');
            } else {
                setAutoSaveError(null);
            }
        }, 5000); // Changed to 5 seconds as requested

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
        };
    }, [formTrigger, user, isAutoSaving, isUploading, autoSaveDraftId, editingProjectId, supabase, hasUnsavedChanges, projectLoaded]);

    //
    // ------------- Before unload handler -------------
    //
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges && !isFormEmpty(formData, selectedCategory)) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, formData, selectedCategory]);

    //
    // ------------- Loading state UI -------------
    //
    if (loadingProject || loadingDrafts) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">{loadingDrafts ? 'Loading your drafts...' : 'Loading...'}</p>
                </div>
            </div>
        );
    }

    //
    // ------------- Draft selection screen -------------
    //
    if (showDraftSelection && userDrafts.length > 0 && !isEditing) {
        return (
            <DraftSelectionScreen
                user={user}
                drafts={userDrafts}
                loading={loadingDrafts}
                onContinueDraft={(draftId) => handleContinueDraft(draftId, navigate, setShowDraftSelection)}
                onStartNew={() => handleStartNew({
                    setFormData,
                    setSelectedCategory,
                    setLinks,
                    setTags,
                    setBuiltWith,
                    setLogoFile,
                    setThumbnailFile,
                    setCoverFiles,
                    setUrlPreview,
                    setAutoSaveDraftId,
                    setHasUnsavedChanges,
                    setLastSavedAt,
                    setShowDraftSelection,
                })}
                onDismiss={() => setShowDraftSelection(false)}
                onDeleteDraft={(id) => handleDeleteDraft(id)} // child should call this on confirm
            />
        );
    }

    //
    // ------------- Main form UI -------------
    //
    return (
        <>
            <SEO noindex={true} />
            <div className="min-h-screen font-sans antialiased text-gray-800 pb-20">
                <div className="max-w-4xl mx-auto px-4 lg:px-0">
                    <FormHeader
                        user={user}
                        isFormEmpty={() => isFormEmpty(formData, selectedCategory)}
                        formData={formData}
                        isAutoSaving={isAutoSaving}
                        lastSavedAt={lastSavedAt}
                        hasUnsavedChanges={hasUnsavedChanges}
                        autoSaveError={autoSaveError}
                        onRetryAutosave={async () => {
                            setAutoSaveError(null);
                            if (hasUnsavedChanges && formData.name && !isFormEmpty(formData, selectedCategory)) {
                                const success = await handleAutoSaveDraft({
                                    user,
                                    isEditing,
                                    isFormEmpty: () => isFormEmpty(formData, selectedCategory),
                                    formData,
                                    isAutoSaving: false,
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
                                });
                                if (!success) {
                                    setAutoSaveError('Auto-save failed. Please try again.');
                                }
                            }
                        }}
                    />
                    <div className="form-container">
                        <FormTabs step={step} setStep={setStep} />
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 && (
                                <BasicInfoStep
                                    formData={formData}
                                    handleInputChange={handleInputChange}
                                    handleTaglineChange={handleTaglineChange}
                                    handleDescriptionChange={handleDescriptionChange}
                                    taglineCharCount={taglineCharCount}
                                    descriptionWordCount={descriptionWordCount}
                                    DESCRIPTION_WORD_LIMIT={DESCRIPTION_WORD_LIMIT}
                                    selectedCategory={selectedCategory}
                                    setSelectedCategory={(value) => {
                                        setSelectedCategory(value);
                                        if (projectLoaded) setHasUnsavedChanges(true);
                                    }}
                                    dynamicCategoryOptions={dynamicCategoryOptions}
                                    urlError={urlError}
                                    handleUrlBlur={handleUrlBlur}
                                    editingLaunched={editingLaunched}
                                    handleGenerateLaunchData={() => handleGenerateLaunchData(false)}
                                    isAILoading={isAILoading}
                                    isRetrying={isRetrying}
                                    generateBasicPreview={(url) => generateBasicPreview(url, setUrlPreview, setIsGeneratingPreview, setSnackbar)}
                                    urlPreview={urlPreview}
                                    isGeneratingPreview={isGeneratingPreview}
                                />
                            )}
                            {step === 2 && (
                                <MediaStep
                                    logoFile={logoFile}
                                    handleLogoChange={handleLogoChange}
                                    removeLogo={removeLogo}
                                    handleImageError={(e, type) => handleImageError(e, type, setSnackbar)}
                                    viewAIImage={(imageUrl, type) => viewAIImage(imageUrl, type, setSnackbar)}
                                    isAILoading={isAILoading}
                                    urlPreview={urlPreview}
                                    thumbnailFile={thumbnailFile}
                                    handleThumbnailChange={handleThumbnailChange}
                                    removeThumbnail={removeThumbnail}
                                    coverFiles={coverFiles}
                                    handleCoverChange={handleCoverChange}
                                    removeCover={removeCover}
                                />
                            )}
                            {step === 3 && (
                                <AdditionalDetailsStep
                                    links={links}
                                    updateLink={updateLink}
                                    addLink={addLink}
                                    removeLink={removeLink}
                                    builtWith={builtWith}
                                    setBuiltWith={(value) => {
                                        setBuiltWith(value);
                                        if (projectLoaded) setHasUnsavedChanges(true);
                                    }}
                                    tags={tags}
                                    setTags={(value) => {
                                        setTags(value);
                                        if (projectLoaded) setHasUnsavedChanges(true);
                                    }}
                                />
                            )}
                        </form>
                        <FormActions
                            step={step}
                            setStep={setStep}
                            handleSaveDraft={handleSaveDraftClick}
                            handleSubmit={handleSubmit}
                        />
                    </div>
                </div>

                <SmartFillDialog
                    open={showSmartFillDialog}
                    pendingAIData={pendingAIData}
                    onCancel={() => handleSmartFillCancel(setShowSmartFillDialog, setPendingAIData)}
                    onFillAll={() => handleSmartFillAll({
                        pendingAIData,
                        setFormData,
                        setLinks,
                        links,
                        setLogoFile,
                        logoFile,
                        setThumbnailFile,
                        thumbnailFile,
                        setTags,
                        tags,
                        setSelectedCategory,
                        selectedCategory,
                        dynamicCategoryOptions,
                        setDynamicCategoryOptions,
                        setShowSmartFillDialog,
                        setPendingAIData,
                        setSnackbar,
                    })}
                    onFillEmpty={() => handleSmartFillEmpty({
                        pendingAIData,
                        setFormData,
                        setLinks,
                        links,
                        setLogoFile,
                        logoFile,
                        setThumbnailFile,
                        thumbnailFile,
                        setTags,
                        tags,
                        setSelectedCategory,
                        selectedCategory,
                        dynamicCategoryOptions,
                        setDynamicCategoryOptions,
                        setShowSmartFillDialog,
                        setPendingAIData,
                        setSnackbar,
                    })}
                />

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ mt: '70px' }}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </>
    );
};

export default Register;
