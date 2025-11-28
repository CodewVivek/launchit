import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const [user, setUser] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [urlError, setUrlError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [loadingProject, setLoadingProject] = useState(false);
    const [existingMediaUrls, setExistingMediaUrls] = useState([]);
    const [existingLogoUrl, setExistingLogoUrl] = useState('');
    const [editingLaunched, setEditingLaunched] = useState(false);
    const [projectLoaded, setProjectLoaded] = useState(false);
    const [builtWith, setBuiltWith] = useState([]);
    const [tags, setTags] = useState([]);
    const [dynamicCategoryOptions, setDynamicCategoryOptions] = useState(categoryOptions);

    const [showSmartFillDialog, setShowSmartFillDialog] = useState(false);
    const [pendingAIData, setPendingAIData] = useState(null);
    const [isAILoading, setIsAILoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [urlPreview, setUrlPreview] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    // Auto-save state
    const [autoSaveDraftId, setAutoSaveDraftId] = useState(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);

    // Draft selection screen state
    const [showDraftSelection, setShowDraftSelection] = useState(false);
    const [userDrafts, setUserDrafts] = useState([]);
    const [loadingDrafts, setLoadingDrafts] = useState(false);

    const [links, setLinks] = useState(['']);
    const [formData, setFormData] = useState({
        name: '',
        websiteUrl: '',
        description: '',
        tagline: '',
        categoryOptions: '',
    });
    const [logoFile, setLogoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [coverFiles, setCoverFiles] = useState([null, null, null, null]);
    const [descriptionWordCount, setDescriptionWordCount] = useState(0);
    const [taglineCharCount, setTaglineCharCount] = useState(0);
    const DESCRIPTION_WORD_LIMIT = 260;

    const handleUrlBlur = (e) => {
        const { value } = e.target;
        if (value && !isValidUrl(value)) {
            setUrlError('Please enter a valid URL (e.g., https://example.com)');
        } else {
            setUrlError('');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        const words = value.trim().split(/\s+/).filter(Boolean);
        if (words.length <= DESCRIPTION_WORD_LIMIT) {
            setFormData({ ...formData, description: value });
            setDescriptionWordCount(words.length);
        } else {
            const limited = words.slice(0, DESCRIPTION_WORD_LIMIT).join(' ');
            setFormData({ ...formData, description: limited });
            setDescriptionWordCount(DESCRIPTION_WORD_LIMIT);
        }
    };

    const handleTaglineChange = (e) => {
        setFormData({ ...formData, tagline: e.target.value.slice(0, 60) });
        setTaglineCharCount(e.target.value.length > 60 ? 60 : e.target.value.length);
    };

    const addLink = () => setLinks([...links, '']);
    const updateLink = (index, value) => {
        const newLinks = [...links];
        newLinks[index] = value;
        setLinks(newLinks);
    };
    const removeLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const handleLogoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const optimizedFile = await optimizeImage(file, 'logo');
                setLogoFile(optimizedFile);
            } catch (error) {
                setLogoFile(file);
            }
        }
    };
    const removeLogo = () => setLogoFile(null);

    const handleThumbnailChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
        }
    };
    const removeThumbnail = () => setThumbnailFile(null);

    const handleCoverChange = async (e, idx) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFiles(prev => prev.map((f, i) => (i === idx ? file : f)));
        }
    };
    const removeCover = (idx) => {
        setCoverFiles(prev => prev.map((f, i) => (i === idx ? null : f)));
    };

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

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setSnackbar({ open: true, message: 'Please sign in to submit a project', severity: 'warning' });
                navigate('/UserRegister');
                return;
            }
            setUser(user);
        };
        checkUser();
    }, [navigate]);

    useEffect(() => {
        const fetchUserDrafts = async () => {
            if (!user) return;
            const editId = searchParams.get('edit');
            const draftId = searchParams.get('draft');
            if (editId || draftId) return;

            setLoadingDrafts(true);
            try {
                const { data: drafts, error } = await supabase
                    .from('projects')
                    .select('id, name, website_url, tagline, description, category_type, created_at, updated_at, logo_url, thumbnail_url')
                    .eq('user_id', user.id)
                    .eq('status', 'draft')
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.error('Error fetching drafts:', error);
                    setUserDrafts([]);
                } else {
                    const meaningfulDrafts = (drafts || []).filter(draft =>
                        draft.name || draft.website_url || draft.tagline || draft.description || draft.category_type
                    );
                    setUserDrafts(meaningfulDrafts);
                    if (meaningfulDrafts.length > 0) {
                        setShowDraftSelection(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching drafts:', error);
                setUserDrafts([]);
            } finally {
                setLoadingDrafts(false);
            }
        };

        if (user && !projectLoaded) {
            fetchUserDrafts();
        }
    }, [user, projectLoaded, searchParams]);

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
        }
    }, [user, projectLoaded, searchParams]);

    useEffect(() => {
        if (!isEditing) {
            const savedDraft = localStorage.getItem('launch_draft');
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    setFormData(draft.formData || {});
                    setSelectedCategory(draft.selectedCategory || null);
                    setLinks(draft.links || ['']);
                } catch { }
            }
        }
    }, [isEditing]);

    useEffect(() => {
        const draft = { formData, selectedCategory, links };
        localStorage.setItem('launch_draft', JSON.stringify(draft));
        if (!isFormEmpty(formData, selectedCategory) && !isEditing) {
            setHasUnsavedChanges(true);
        }
    }, [formData, selectedCategory, links]);

    useEffect(() => {
        if (!user || isEditing || isFormEmpty(formData, selectedCategory) || !formData.name || isAutoSaving) {
            return;
        }
        if (projectLoaded && !hasUnsavedChanges) {
            return;
        }
        const autoSaveTimer = setTimeout(async () => {
            await handleAutoSaveDraft({
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
        }, 3000);
        return () => clearTimeout(autoSaveTimer);
    }, [formData, selectedCategory, links, tags, builtWith, user, isEditing, hasUnsavedChanges]);

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

    if (loadingProject || loadingDrafts) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{loadingDrafts ? 'Loading your drafts...' : 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (showDraftSelection && userDrafts.length > 0 && !isEditing) {
        return (
            <DraftSelectionScreen
                user={user}
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
            />
        );
    }

    return (
        <div className="min-h-screen font-sans antialiased text-gray-800 pb-20">
            <div className="max-w-4xl mx-auto px-4 lg:px-0">
                <FormHeader
                    user={user}
                    isFormEmpty={() => isFormEmpty(formData, selectedCategory)}
                    formData={formData}
                    isAutoSaving={isAutoSaving}
                    lastSavedAt={lastSavedAt}
                    hasUnsavedChanges={hasUnsavedChanges}
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
                                setSelectedCategory={setSelectedCategory}
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
                                setBuiltWith={setBuiltWith}
                                tags={tags}
                                setTags={setTags}
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
    );
};

export default Register;
