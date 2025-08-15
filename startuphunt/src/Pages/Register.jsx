import React, { useState, useCallback, useEffect } from 'react';
import { Plus, X, Upload, User, Star, Rocket, Link as LinkIcon, Edit3, Image, Layout, Layers, Hash, Eye } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import { nanoid } from 'nanoid';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import categoryOptions from '../Components/categoryOptions';
import BuiltWithSelect from '../Components/BuiltWithSelect';
import { config } from '../config';

// Custom styles for the react-select component to match the new UI
const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.5rem',
        padding: '0.25rem',
        backgroundColor: '#f9fafb', // Light gray background
        borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
        boxShadow: state.isFocused ? '0 0 0 1px #2563eb' : 'none',
        '&:hover': { borderColor: '#d1d5db' },
        fontSize: '0.875rem',
    }),
    singleValue: (provided) => ({ ...provided, color: '#1f2937' }),
    placeholder: (provided) => ({ ...provided, color: '#9ca3af' }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? '#eff6ff' : '#fff',
        color: state.isFocused ? '#2563eb' : '#1f2937',
        fontSize: '0.875rem',
    }),
};

function getLinkType(url) {
    if (!url) return { label: 'Website', icon: '🌐' };
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', icon: '▶️' };
    if (url.includes('instagram.com')) return { label: 'Instagram', icon: '📸' };
    if (url.includes('play.google.com')) return { label: 'Play Store', icon: '🤖' };
    if (url.includes('apps.apple.com')) return { label: 'App Store', icon: '🍎' };
    if (url.includes('linkedin.com')) return { label: 'LinkedIn', icon: '💼' };
    if (url.includes('twitter.com') || url.includes('x.com')) return { label: 'Twitter/X', icon: '🐦' };
    if (url.includes('facebook.com')) return { label: 'Facebook', icon: '📘' };
    return { label: 'Website', icon: '🌐' };
}

const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
};

const slugify = (text) =>
    text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const sanitizeFileName = (fileName) => {
    // Remove spaces, special characters, and keep only alphanumeric, dots, hyphens, underscores
    return fileName
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9.-_]/g, '') // Remove special characters except dots, hyphens, underscores
        .toLowerCase(); // Convert to lowercase
};

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

    // Smart Fill Dialog States
    const [showSmartFillDialog, setShowSmartFillDialog] = useState(false);
    const [pendingAIData, setPendingAIData] = useState(null);
    const [isAILoading, setIsAILoading] = useState(false);

    const handleUrlBlur = (e) => {
        const { value } = e.target;
        if (value && !isValidUrl(value)) {
            setUrlError('Please enter a valid URL (e.g., https://example.com)');
        } else {
            setUrlError('');
        }
    };

    const [links, setLinks] = useState(['']);
    const addLink = () => setLinks([...links, '']);
    const updateLink = (index, value) => {
        const newLinks = [...links];
        newLinks[index] = value;
        setLinks(newLinks);
    };
    const removeLink = (index) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const [formData, setFormData] = useState({
        name: '',
        websiteUrl: '',
        description: '',
        tagline: '',
        categoryOptions: '',
    });
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const [logoFile, setLogoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [coverFiles, setCoverFiles] = useState([null, null, null, null]);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) setLogoFile(file);
    };
    const removeLogo = () => setLogoFile(null);

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) setThumbnailFile(file);
    };
    const removeThumbnail = () => setThumbnailFile(null);

    const handleCoverChange = (e, idx) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFiles(prev => prev.map((f, i) => (i === idx ? file : f)));
        }
    };
    const removeCover = (idx) => {
        setCoverFiles(prev => prev.map((f, i) => (i === idx ? null : f)));
    };

    const [descriptionWordCount, setDescriptionWordCount] = useState(0);
    const DESCRIPTION_WORD_LIMIT = 260;

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

    const [taglineCharCount, setTaglineCharCount] = useState(0);

    const handleTaglineChange = (e) => {
        setFormData({ ...formData, tagline: e.target.value.slice(0, 60) });
        setTaglineCharCount(e.target.value.length > 60 ? 60 : e.target.value.length);
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
        const loadProjectForEditing = async () => {
            const editId = searchParams.get('edit');
            const draftId = searchParams.get('draft');
            const projectId = editId || draftId;

            if (projectId && user && !projectLoaded) {
                setLoadingProject(true);
                setIsEditing(true);
                setEditingProjectId(projectId);

                try {
                    const { data: project, error } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('id', projectId)
                        .eq('user_id', user.id)
                        .single();

                    if (error) {
                        console.error('Error loading project:', error);
                        setSnackbar({ open: true, message: 'Project not found or access denied.', severity: 'error' });
                        return;
                    }

                    if (project) {
                        setEditingLaunched(project.status !== 'draft');
                        setFormData({
                            name: project.name || '',
                            websiteUrl: project.website_url || '',
                            description: project.description || '',
                            tagline: project.tagline || '',
                        });
                        if (project.category_type) {
                            const categoryOption = categoryOptions.flatMap(group => group.options).find(option => option.value === project.category_type);
                            setSelectedCategory(categoryOption || null);
                        }
                        if (project.links && project.links.length > 0) {
                            setLinks(project.links);
                        } else {
                            setLinks(['']);
                        }
                        setBuiltWith(project.built_with?.map(tech => ({ value: tech, label: tech })) || []);
                        setTags(project.tags || []);
                        setExistingMediaUrls(project.media_urls || []);
                        setExistingLogoUrl(project.logo_url || '');
                        setLogoFile(project.logo_url || null);
                        setThumbnailFile(project.thumbnail_url || null);
                        setCoverFiles(project.cover_urls || [null, null, null, null]);
                    }
                } catch (error) {
                    console.error('Error loading project for editing:', error);
                    setSnackbar({ open: true, message: 'Failed to load project for editing.', severity: 'error' });
                } finally {
                    setLoadingProject(false);
                    setProjectLoaded(true);
                }
            }
        };
        if (user && !projectLoaded) {
            loadProjectForEditing();
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
        const draft = {
            formData,
            selectedCategory,
            links,
        };
        localStorage.setItem('launch_draft', JSON.stringify(draft));
    }, [formData, selectedCategory, links]);

    const isFormEmpty = () => {
        // Check if all required fields from Step 1 are empty
        return !formData.name && !formData.tagline && !formData.description && !formData.websiteUrl && !selectedCategory;
    };

    // Count how many fields are filled (excluding URL)
    const getFilledFieldsCount = () => {
        let count = 0;

        // Step 1: Basic required fields
        if (formData.name) count++;
        if (formData.tagline) count++;
        if (formData.description) count++;
        if (selectedCategory) count++;

        // Step 2: Required media fields
        if (logoFile) count++;
        if (thumbnailFile) count++;
        if (coverFiles && coverFiles.some(f => !!f)) count++;

        // Step 3: Optional fields
        if (tags.length > 0) count++;
        if (links.length > 1 || (links.length === 1 && links[0])) count++;
        if (builtWith.length > 0) count++;

        return count;
    };

    const validateForm = () => {
        // Step 1: All basic fields are required
        if (!formData.name || !formData.websiteUrl || !formData.tagline || !selectedCategory || !formData.description) {
            setSnackbar({ open: true, message: 'Please fill in all required fields in Step 1.', severity: 'error' });
            setStep(1);
            return false;
        }

        // Step 2: Logo, Thumbnail, and at least 1 cover image are required
        if (!logoFile) {
            setSnackbar({ open: true, message: 'Please upload a logo image in Step 2.', severity: 'error' });
            setStep(2);
            return false;
        }

        if (!thumbnailFile) {
            setSnackbar({ open: true, message: 'Please upload a thumbnail image in Step 2.', severity: 'error' });
            setStep(2);
            return false;
        }

        const hasCover = coverFiles && coverFiles.some(f => !!f);
        if (!hasCover) {
            setSnackbar({ open: true, message: 'Please upload at least one cover image in Step 2.', severity: 'error' });
            setStep(2);
            return false;
        }

        // Step 3: All fields are optional (no validation needed)
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!user) {
            setSnackbar({ open: true, message: 'Please sign in to submit a project', severity: 'error' });
            navigate('/UserRegister');
            return;
        }

        const submissionData = {
            name: formData.name,
            website_url: formData.websiteUrl,
            tagline: formData.tagline,
            description: formData.description,
            category_type: selectedCategory?.value,
            links: links.filter(link => link.trim() !== ''),
            built_with: builtWith.map(item => item.value),
            tags: tags,
            media_urls: [], // Required NOT NULL field - empty array for now
            created_at: new Date().toISOString(),
            user_id: user.id,
            updated_at: new Date().toISOString(),
            status: 'launched',
        };

        const baseSlug = slugify(formData.name);
        const uniqueSlug = `${baseSlug}-${nanoid(6)}`;
        submissionData.slug = uniqueSlug;

        try {
            let fileUrls = [...existingMediaUrls];
            let logoUrl = existingLogoUrl;
            let thumbnailUrl = typeof thumbnailFile === 'string' ? thumbnailFile : '';
            let coverUrls = [];

            if (logoFile && typeof logoFile !== 'string') {
                const logoPath = `${Date.now()}-logo-${sanitizeFileName(logoFile.name)}`;
                const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, logoFile);
                if (logoErrorUpload) throw logoErrorUpload;
                const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                logoUrl = logoUrlData.publicUrl;
            }
            submissionData.logo_url = logoUrl;

            if (thumbnailFile && typeof thumbnailFile !== 'string') {
                const thumbPath = `${Date.now()}-thumbnail-${sanitizeFileName(thumbnailFile.name)}`;
                const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, thumbnailFile);
                if (thumbError) throw thumbError;
                const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                thumbnailUrl = thumbUrlData.publicUrl;
            }
            submissionData.thumbnail_url = thumbnailUrl;

            if (coverFiles && coverFiles.length > 0) {
                for (let i = 0; i < coverFiles.length; i++) {
                    const file = coverFiles[i];
                    if (file && typeof file !== 'string') {
                        const coverPath = `${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
                        const { data: coverData, error: coverErrorUpload } = await supabase.storage.from('startup-media').upload(coverPath, file);
                        if (coverErrorUpload) throw coverErrorUpload;
                        const { data: coverUrlData } = supabase.storage.from('startup-media').getPublicUrl(coverPath);
                        coverUrls.push(coverUrlData.publicUrl);
                    } else if (typeof file === 'string') {
                        coverUrls.push(file);
                    }
                }
            }
            submissionData.cover_urls = coverUrls;

            let finalSubmissionData;
            if (isEditing && editingProjectId) {
                submissionData.status = 'launched';
                const { data, error } = await supabase.from('projects').update(submissionData).eq('id', editingProjectId).select().single();
                if (error) throw error;
                finalSubmissionData = data;
            } else {
                const { data, error } = await supabase.from('projects').insert([submissionData]).select().single();
                if (error) throw error;
                finalSubmissionData = data;
            }
            setSnackbar({ open: true, message: 'Launch submitted successfully!', severity: 'success' });

            setTimeout(() => {
                navigate(`/launches/${finalSubmissionData.slug}`);
            }, 1000);

            setFormData({ name: '', websiteUrl: '', description: '', tagline: '' });
            setSelectedCategory(null);
            setLinks(['']);
            setTags([]);
            setLogoFile(null);
            setThumbnailFile(null);
            setCoverFiles([null, null, null, null]);
            setEditingProjectId(null);
        } catch (error) {
            console.error('Error submitting form:', error);
            setSnackbar({ open: true, message: 'Failed to register startup. Please try again.', severity: 'error' });
        }
    };

    const handleGenerateLaunchData = async () => {
        if (!formData.websiteUrl) {
            setSnackbar({ open: true, message: "Please enter a website URL first.", severity: 'warning' });
            return;
        }

        setIsAILoading(true); // Start loading

        try {
            const { data: userData } = await supabase.auth.getUser();
            const user_id = userData?.user?.id;
            const res = await fetch(config.API_URL + "/generatelaunchdata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: formData.websiteUrl,
                    user_id,
                }),
            });
            const gptData = await res.json();
            if (gptData.err || gptData.error) throw new Error(gptData.message);

            // Process AI response
            // AI Response processed successfully

            // Check how many fields are already filled
            const filledCount = getFilledFieldsCount();
            if (filledCount < 4) {
                // If less than 4 fields filled, directly apply AI data
                applyAIData(gptData, false); // Fill all fields
                setSnackbar({ open: true, message: "🤖 All fields auto-filled with AI data!", severity: 'success' });
            } else {
                // If 4+ fields filled, show dialog for user choice
                setPendingAIData(gptData);
                setShowSmartFillDialog(true);
            }
        }
        catch (error) {
            console.error("Auto Generate failed :", error);

            // Check if it's a specific error and provide better feedback
            let errorMessage = "AI failed to extract startup info...";

            if (error.message && error.message.includes("Microlink")) {
                errorMessage = "AI extracted text data but failed to generate logo/thumbnail. You can upload them manually!";
            } else if (error.message && error.message.includes("OpenAI")) {
                errorMessage = "AI service temporarily unavailable. Please try again later.";
            }

            setSnackbar({ open: true, message: errorMessage, severity: 'warning' });
        } finally {
            setIsAILoading(false); // Stop loading
        }
    }

    // Smart Fill Functions
    const applyAIData = (gptData, onlyEmptyFields = false) => {
        // Update form data with AI-generated content
        setFormData((prev) => ({
            ...prev,
            name: onlyEmptyFields ? (prev.name || gptData.name || "") : (gptData.name || prev.name),
            websiteUrl: onlyEmptyFields ? (prev.websiteUrl || gptData.website_url || "") : (gptData.website_url || prev.websiteUrl),
            tagline: onlyEmptyFields ? (prev.tagline || gptData.tagline || "") : (gptData.tagline || prev.tagline),
            description: onlyEmptyFields ? (prev.description || gptData.description || "") : (gptData.description || prev.description),
        }));

        // Set links if provided (and user doesn't have links or onlyEmptyFields is false)
        if (gptData.links?.length && (!onlyEmptyFields || links.length <= 1 && !links[0])) {
            setLinks(gptData.links);
        }

        // Set AI-extracted logo URL (only if user doesn't have logo or onlyEmptyFields is false)
        if (gptData.logo_url && (!onlyEmptyFields || !logoFile)) {
            setLogoFile(gptData.logo_url);
        }

        // Set AI-generated website screenshot as thumbnail (only if user doesn't have thumbnail or onlyEmptyFields is false)
        if (gptData.thumbnail_url && (!onlyEmptyFields || !thumbnailFile)) {
            setThumbnailFile(gptData.thumbnail_url);
        }

        // Set AI-generated tags (only if user doesn't have tags or onlyEmptyFields is false)
        if (gptData.features?.length && (!onlyEmptyFields || tags.length === 0)) {
            setTags(gptData.features);
        }

        // Set AI-detected category (only if user doesn't have category or onlyEmptyFields is false)
        if (gptData.category && (!onlyEmptyFields || !selectedCategory)) {
            let categoryOption = dynamicCategoryOptions
                .flatMap(group => group.options)
                .find(option =>
                    option.value === gptData.category ||
                    option.label.toLowerCase().includes(gptData.category.toLowerCase())
                );

            // If no existing category found, create a new one and add it to options
            if (!categoryOption) {
                categoryOption = {
                    value: gptData.category.toLowerCase().replace(/\s+/g, '-'),
                    label: gptData.category,
                    isNew: true
                };

                // Add the new category to the "🧪 Emerging Technologies" group
                const updatedCategoryOptions = [...dynamicCategoryOptions];
                const emergingTechIndex = updatedCategoryOptions.findIndex(
                    group => group.label === "🧪 Emerging Technologies"
                );

                if (emergingTechIndex !== -1) {
                    updatedCategoryOptions[emergingTechIndex].options.push(categoryOption);
                } else {
                    // If no Emerging Technologies group, create a new group
                    updatedCategoryOptions.push({
                        label: "🤖 AI-Detected Categories",
                        options: [categoryOption]
                    });
                }

                setDynamicCategoryOptions(updatedCategoryOptions);
            }

            if (categoryOption) {
                setSelectedCategory(categoryOption);
            }
        }
    };

    const handleSmartFillAll = () => {
        applyAIData(pendingAIData, false);
        setShowSmartFillDialog(false);
        setPendingAIData(null);
        setSnackbar({ open: true, message: "🤖 All fields updated with AI data!", severity: 'success' });
    };

    const handleSmartFillEmpty = () => {
        applyAIData(pendingAIData, true);
        setShowSmartFillDialog(false);
        setPendingAIData(null);
        setSnackbar({ open: true, message: "🤖 Empty fields filled with AI data!", severity: 'success' });
    };

    const handleSmartFillCancel = () => {
        setShowSmartFillDialog(false);
        setPendingAIData(null);
    };

    // Function to view AI-generated images in new tab
    const viewAIImage = (imageUrl, type) => {
        if (imageUrl) {
            window.open(imageUrl, '_blank');
        } else {
            setSnackbar({ open: true, message: `No AI-generated ${type} available`, severity: 'info' });
        }
    };

    // Handle image loading errors
    const handleImageError = (e, type) => {
        console.error(`❌ Failed to load AI-generated ${type}:`, e.target.src);

        // Check if it's a favicon URL (common issue)
        if (e.target.src.includes('favicon.ico')) {
            setSnackbar({
                open: true,
                message: `⚠️ Favicon failed to load. This is common with some websites. You can upload your own ${type} or try again.`,
                severity: 'warning'
            });
        } else {
            setSnackbar({
                open: true,
                message: `⚠️ AI-generated ${type} failed to load. The image URL may be restricted.`,
                severity: 'warning'
            });
        }

        // Don't immediately reset - let user decide
        // The image will show broken icon, but URL is preserved
        // URL preserved for user decision
    };

    const handleSaveDraft = async () => {
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
        let draftId = editingProjectId;
        if (!isEditing) {
            const { data: existingDraft } = await supabase
                .from('projects')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', formData.name)
                .eq('status', 'draft')
                .maybeSingle();
            if (existingDraft && existingDraft.id) {
                draftId = existingDraft.id;
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
                await supabase.from('projects').insert([draftData]);
            }
            setSnackbar({ open: true, message: 'Launch saved!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to save draft. Please try again.', severity: 'error' });
            console.error('Supabase error:', error);
        }
    };

    const handleRemoveExistingMedia = (url) => {
        setExistingMediaUrls(existingMediaUrls.filter(u => u !== url));
    };
    const handleRemoveExistingLogo = () => {
        setExistingLogoUrl('');
    };

    if (loadingProject) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans antialiased text-gray-800 pb-20">
            <style>{`
                .form-tab-panel {
                    padding: 2rem;
                    display: none;
                    animation: fadeIn 0.5s ease-in-out;
                }
                .form-tab-panel.active {
                    display: block;
                }
                .tab-button {
                    padding: 0.75rem 1.5rem;
                    border-bottom: 2px solid transparent;
                    font-weight: 600;
                    color: #6b7280;
                    transition: all 0.2s ease;
                }
                .tab-button.active {
                    color: #2563eb;
                    border-bottom-color: #2563eb;
                }
                .tab-button:hover:not(.active) {
                    color: #1f2937;
                }
                .form-field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .form-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #1f2937;
                }
                .form-input, .form-textarea, .react-select__control {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #d1d5db;
                    background-color: #f9fafb;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .form-input:focus, .form-textarea:focus, .react-select__control--is-focused {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
                }
                .file-input-label {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    background-color: #f3f4f6;
                    border: 2px dashed #d1d5db;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .file-input-label:hover {
                    background-color: #e5e7eb;
                }
                .form-actions-bar {
                    border-top: 1px solid #e5e7eb;
                    padding: 10px 2px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    border-radius: 0 0 1rem 1rem;
                    
                }
                .btn-primary {
                    background-color: #2563eb;
                    color: white;
                    font-weight: 600;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    transition: background-color 0.2s ease;
                }
                .btn-primary:hover {
                    background-color: #1e40af;
                }
                .btn-tertiary {
                    background-color: #f59e0b;
                    color: white;
                    font-weight: 600;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    transition: background-color 0.2s ease;
                }
                .btn-tertiary:hover {
                    background-color: #d97706;
                }
                .btn-secondary {
                    background-color: #f3f4f6;
                    color: #1f2937;
                    font-weight: 600;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    transition: background-color 0.2s ease;
                }
                .btn-secondary:hover {
                    background-color: #e5e7eb;
                }
                .btn-text-icon {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #2563eb;
                    font-weight: 500;
                    font-size: 0.875rem;
                }
                .text-error {
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 768px) {
                    .form-actions-bar {
                        padding: 1rem;
                    }
                }
            `}</style>
            <div className="max-w-4xl mx-auto px-4 lg:px-0">
                <header className="text-center py-8">
                    <h1 className="text-3xl font-bold mb-2">Submit Your Launch</h1>
                    <p className="text-gray-500 mt-2">
                        Get your product in front of the right audience. Be seen, gain traction, and grow with confidence!
                    </p>
                </header>
                <div className="form-container">
                    {/* Tabs for Navigation */}
                    <nav className="flex justify-center border-b border-gray-200 px-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={`tab-button ${step === 1 ? 'active' : ''}`}
                        >
                            Basic Info
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className={`px-6 py-3 -mb-px border-b-2 text-sm font-semibold transition-colors duration-200
                                ${step === 2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Media
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(3)}
                            className={`px-6 py-3 -mb-px border-b-2 text-sm font-semibold transition-colors duration-200
                                ${step === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Details
                        </button>
                    </nav>

                    <form onSubmit={handleSubmit}>
                        {/* Step-specific content */}
                        {step === 1 && (
                            <div className="form-tab-panel active">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-field-group">
                                            <label className="form-label" htmlFor="name">Name of the launch</label>
                                            <input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                maxLength={30}
                                                disabled={editingLaunched}
                                                placeholder='e.g LaunchIT'
                                            />
                                            <div className="text-xs text-gray-400 text-right mt-1">{formData.name.length} / 30</div>
                                        </div>
                                        <div className="form-field-group">
                                            <label className="form-label" htmlFor="websiteUrl">Website URL</label>
                                            <input
                                                id="websiteUrl"
                                                name="websiteUrl"
                                                value={formData.websiteUrl}
                                                onChange={handleInputChange}
                                                onBlur={handleUrlBlur}
                                                className={`form-input ${urlError ? 'border-red-500' : ''}`}
                                                placeholder="https://yourproject.com"
                                                disabled={editingLaunched}
                                            />
                                            {urlError && <p className="text-red-500 text-sm mt-1">{urlError}</p>}
                                            <button
                                                type="button"
                                                onClick={handleGenerateLaunchData}
                                                disabled={isAILoading}
                                                className={`btn-text-icon ${isAILoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {isAILoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Rocket className="w-4 h-4" />
                                                        Auto-generate from URL
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="form-field-group">
                                            <label className="form-label" htmlFor="tagline">Tagline</label>
                                            <input
                                                id="tagline"
                                                name="tagline"
                                                value={formData.tagline}
                                                onChange={handleTaglineChange}
                                                className="form-input"
                                                maxLength={60}
                                                placeholder="catchy tagline of what the launch does."
                                            />
                                            <div className="text-xs text-gray-400 text-right mt-1">{taglineCharCount} / 60</div>
                                        </div>
                                        <div className="form-field-group">
                                            <label className="form-label" htmlFor="category">Category(ies)</label>
                                            <Select
                                                options={dynamicCategoryOptions}
                                                isClearable={true}
                                                isSearchable={true}
                                                value={selectedCategory}
                                                onChange={setSelectedCategory}
                                                styles={customSelectStyles}
                                                placeholder="Select a category"
                                            />
                                        </div>
                                        <div className="form-field-group md:col-span-2">
                                            <label className="form-label" htmlFor="description">Description</label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleDescriptionChange}
                                                rows={4}
                                                className="form-input"
                                                placeholder="Describe your launch in detail. What problem does it solve? What makes it unique?"
                                            />
                                            <div className="text-xs text-gray-400 text-right mt-1">{descriptionWordCount} / {DESCRIPTION_WORD_LIMIT}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="form-tab-panel active">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold">Media</h3>
                                        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                            💡 <strong>AI Tip:</strong> Use the "Auto-generate from URL" button in Step 1 to automatically generate logo and thumbnail!
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="form-label">Logo</label>
                                            <div className="flex items-center gap-6 mt-2">
                                                <div className="relative">
                                                    <label className="w-24 h-24 flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                                        {logoFile ? (
                                                            <img
                                                                src={typeof logoFile === 'string' ? logoFile : URL.createObjectURL(logoFile)}
                                                                alt="Logo Preview"
                                                                className="w-full h-full object-cover rounded-2xl"
                                                                onError={(e) => typeof logoFile === 'string' ? handleImageError(e, 'logo') : null}
                                                            />
                                                        ) : isAILoading ? (
                                                            <div className="flex flex-col items-center justify-center text-blue-600">
                                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                                                                <span className="text-xs">AI generating...</span>
                                                            </div>
                                                        ) : (
                                                            <Plus className="w-6 h-6 text-gray-400" />
                                                        )}
                                                    </label>
                                                    {logoFile && typeof logoFile === 'string' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => viewAIImage(logoFile, 'logo')}
                                                            className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow hover:bg-blue-600 transition-colors"
                                                            title="View AI-generated logo"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Recommended: 240x240px | JPG, PNG, GIF. Max 2MB
                                                    {logoFile && (
                                                        <div className="mt-2 space-y-1">
                                                            <button type="button" onClick={removeLogo} className="block text-red-600 hover:text-red-800">Remove</button>
                                                            {typeof logoFile === 'string' && (
                                                                <div className="text-xs text-blue-600">🤖 AI-generated logo</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {isAILoading && !logoFile && (
                                                        <div className="mt-2 text-xs text-blue-600">🔄 AI is generating logo...</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="form-label">Thumbnail (Dashboard)</label>
                                            <div className="flex items-center gap-6 mt-2">
                                                <div className="relative">
                                                    <label className="w-40 h-28 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                                        <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                                                        {thumbnailFile ? (
                                                            <img
                                                                src={typeof thumbnailFile === 'string' ? thumbnailFile : URL.createObjectURL(thumbnailFile)}
                                                                alt="Thumbnail Preview"
                                                                className="w-full h-full object-cover rounded-lg"
                                                                onError={(e) => typeof thumbnailFile === 'string' ? handleImageError(e, 'thumbnail') : null}
                                                            />
                                                        ) : isAILoading ? (
                                                            <div className="flex flex-col items-center justify-center text-blue-600">
                                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                                                                <span className="text-xs">AI generating...</span>
                                                            </div>
                                                        ) : (
                                                            <Plus className="w-6 h-6 text-gray-400" />
                                                        )}
                                                    </label>
                                                    {thumbnailFile && typeof thumbnailFile === 'string' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => viewAIImage(thumbnailFile, 'thumbnail')}
                                                            className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow hover:bg-blue-600 transition-colors"
                                                            title="View AI-generated thumbnail"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Recommended: 500x500px or 600x400px. Max 2MB.<br />This will be shown in the dashboard.
                                                    {thumbnailFile && (
                                                        <div className="mt-2 space-y-1">
                                                            <button type="button" onClick={removeThumbnail} className="block text-red-600 hover:text-red-800">Remove</button>
                                                            {typeof thumbnailFile === 'string' && (
                                                                <div className="text-xs text-blue-600">🤖 AI-generated screenshot</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {isAILoading && !thumbnailFile && (
                                                        <div className="mt-2 text-xs text-blue-600">🔄 AI is generating thumbnail...</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="form-label">Cover image(s)</label>
                                            <div className="flex flex-wrap gap-4 mt-2">
                                                {coverFiles.map((file, idx) => (
                                                    <div key={idx} className="relative">
                                                        <label className="w-32 h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                                            <input type="file" accept="image/*" onChange={e => handleCoverChange(e, idx)} className="hidden" />
                                                            {file ? (
                                                                <img src={typeof file === 'string' ? file : URL.createObjectURL(file)} alt={`Cover ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                                                            ) : (
                                                                <Plus className="w-6 h-6 text-gray-400" />
                                                            )}
                                                        </label>
                                                        {file && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); removeCover(idx); }}
                                                                className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-100"
                                                            >
                                                                <X className="w-3 h-3 text-red-600" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-2">
                                                Recommended: 1270x760px+ • Up to 4 images • Max 5MB each
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {step === 3 && (
                            <div className="form-tab-panel active">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="form-label">Links</label>
                                            <div className="space-y-4 mt-2">
                                                {links.map((link, index) => {
                                                    const { label, icon } = getLinkType(link);
                                                    return (
                                                        <div key={index} className="flex items-center gap-4">
                                                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-xl">
                                                                {icon}
                                                            </span>
                                                            <input
                                                                type="url"
                                                                value={link}
                                                                onChange={e => updateLink(index, e.target.value)}
                                                                placeholder={`Enter ${label} URL`}
                                                                className="form-input flex-1"
                                                            />
                                                            {links.length > 1 && (
                                                                <button type="button" onClick={() => removeLink(index)} className="p-2 text-red-600 hover:bg-gray-100 rounded-full">
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <button
                                                    type="button"
                                                    onClick={addLink}
                                                    className="btn-text-icon"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span>Add another link</span>
                                                </button>
                                            </div>
                                        </div>
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
                        )}
                    </form>
                    <div className="form-actions-bar">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="btn-secondary"
                            >
                                Previous
                            </button>
                        )}
                        <div className="ml-auto flex gap-4">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="btn-tertiary"
                            >
                                Save as Draft
                            </button>
                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step + 1)}
                                    className="btn-primary"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="btn-primary"
                                >
                                    Submit Launch
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Fill Dialog */}
            <Dialog open={showSmartFillDialog} onClose={handleSmartFillCancel} maxWidth="sm" fullWidth>
                <DialogTitle>🤖 AI Data Generated</DialogTitle>
                <DialogContent>
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            AI has successfully extracted data from your website! How would you like to proceed?
                        </p>

                        {pendingAIData && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <h4 className="font-medium text-gray-800">Preview of AI-generated data:</h4>
                                {pendingAIData.name && <p><strong>Name:</strong> {pendingAIData.name}</p>}
                                {pendingAIData.tagline && <p><strong>Tagline:</strong> {pendingAIData.tagline}</p>}
                                {pendingAIData.category && <p><strong>Category:</strong> {pendingAIData.category}</p>}
                                {pendingAIData.features?.length > 0 && (
                                    <p><strong>Tags:</strong> {pendingAIData.features.join(', ')}</p>
                                )}
                                {pendingAIData.logo_url && <p><strong>Logo:</strong> Found ✅</p>}
                                {pendingAIData.thumbnail_url && <p><strong>Screenshot:</strong> Generated ✅</p>}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                                <h5 className="font-medium text-blue-800">Fill All Fields</h5>
                                <p className="text-sm text-blue-600">Replace existing data with AI-generated content</p>
                            </div>
                            <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                                <h5 className="font-medium text-green-800">Fill Empty Fields Only</h5>
                                <p className="text-sm text-green-600">Keep your existing data, only fill empty fields</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSmartFillCancel} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleSmartFillEmpty} color="success" variant="contained">
                        Fill Empty Only
                    </Button>
                    <Button onClick={handleSmartFillAll} color="primary" variant="contained">
                        Fill All Fields
                    </Button>
                </DialogActions>
            </Dialog>

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