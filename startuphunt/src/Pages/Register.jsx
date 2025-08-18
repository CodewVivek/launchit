import React, { useState, useCallback, useEffect } from 'react';
import { Plus, X, Upload, User, Star, Rocket, Link as LinkIcon, Edit3, Image, Layout, Layers, Hash, Eye, Wand2, CheckCircle } from 'lucide-react';
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
import { moderateContent } from '../utils/aiApi';
import { optimizeImage, formatFileSize } from '../utils/imageOptimizer';

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

const slugify = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

const sanitizeFileName = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return 'file';
    return fileName
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9.-_]/g, '') // Remove special characters except dots, hyphens, underscores
        .toLowerCase();
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

    // Content Moderation State
    const [isModerating, setIsModerating] = useState(false);

    // Add retry state
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    // Add fallback URL preview functionality
    const [urlPreview, setUrlPreview] = useState(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

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

    const handleLogoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Optimize logo image before setting
                const optimizedFile = await optimizeImage(file, 'logo');
                setLogoFile(optimizedFile);
            } catch (error) {
                // Image optimization failed, fallback to original file
                setLogoFile(file);
            }
        }
    };
    const removeLogo = () => setLogoFile(null);

    const handleThumbnailChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Optimize thumbnail image before setting
                const optimizedFile = await optimizeImage(file, 'thumbnail');
                setThumbnailFile(optimizedFile);
            } catch (error) {
                // Image optimization failed, fallback to original file
                setThumbnailFile(file);
            }
        }
    };
    const removeThumbnail = () => setThumbnailFile(null);

    const handleCoverChange = async (e, idx) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Optimize cover image before setting
                const optimizedFile = await optimizeImage(file, 'cover');
                setCoverFiles(prev => prev.map((f, i) => (i === idx ? optimizedFile : f)));
            } catch (error) {
                // Image optimization failed, fallback to original file
                setCoverFiles(prev => prev.map((f, i) => (i === idx ? file : f)));
            }
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
        const errors = [];

        // STEP 1: Fully Required Fields
        if (!formData.name || formData.name.trim().length === 0) {
            errors.push('Startup name is required');
        } else if (formData.name.trim().length < 3) {
            errors.push('Startup name must be at least 3 characters long');
        }

        if (!formData.websiteUrl || formData.websiteUrl.trim().length === 0) {
            errors.push('Website URL is required');
        } else if (!isValidUrl(formData.websiteUrl)) {
            errors.push('Please enter a valid website URL (e.g., https://example.com)');
        }

        if (!formData.description || formData.description.trim().length === 0) {
            errors.push('Description is required');
        } else if (formData.description.trim().length < 20) {
            errors.push('Description must be at least 20 characters long');
        }

        if (!formData.tagline || formData.tagline.trim().length === 0) {
            errors.push('Tagline is required');
        } else if (formData.tagline.trim().length < 10) {
            errors.push('Tagline must be at least 10 characters long');
        }

        if (!selectedCategory) {
            errors.push('Please select a category for your startup');
        }

        // STEP 2: Cover Images (2 required) + Logo/Thumbnail (if AI generation failed)

        // Check cover images - require at least 2
        const validCoverFiles = coverFiles.filter(file => file !== null);
        if (validCoverFiles.length < 2) {
            errors.push('Please upload at least 2 cover images for your startup');
        }

        // Check logo/thumbnail - required if AI generation failed or no preview available
        const hasAIGeneratedImages = urlPreview && (urlPreview.logo || urlPreview.screenshot);
        const hasUserUploadedImages = logoFile || thumbnailFile;

        if (!hasAIGeneratedImages && !hasUserUploadedImages) {
            errors.push('Please provide either a logo or thumbnail image (AI generation failed, manual upload required)');
        }

        // STEP 3: Optional Fields (no validation required)
        // - tags
        // - built-with technologies  
        // - links

        if (errors.length > 0) {
            const errorMessage = `Please fix the following issues:\n${errors.join('\n')}`;
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
            return false;
        }

        return true;
    };

    // Content Moderation Function
    const checkContentModeration = async (content, contentType) => {
        try {
            const result = await moderateContent(content, contentType, user?.id);
            return result;
        } catch (error) {
            console.error('Moderation error:', error);
            return { action: 'approve', message: 'Moderation failed, allowing submission' };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (!user) {
            setSnackbar({ open: true, message: 'Please sign in to submit a project', severity: 'error' });
            navigate('/UserRegister');
            return;
        }

        // Content Moderation Check
        setIsModerating(true);
        try {
            const nameModeration = await checkContentModeration(formData.name, 'project_name');
            const taglineModeration = await checkContentModeration(formData.tagline, 'project_tagline');
            const descriptionModeration = await checkContentModeration(formData.description, 'project_description');

            // Check for high severity content (70-100%)
            const highSeverityContent = [];
            if (nameModeration.action === 'reject') highSeverityContent.push('Project Name');
            if (taglineModeration.action === 'reject') highSeverityContent.push('Tagline');
            if (descriptionModeration.action === 'reject') highSeverityContent.push('Description');

            if (highSeverityContent.length > 0) {
                setSnackbar({
                    open: true,
                    message: `🚫 Submission blocked: ${highSeverityContent.join(', ')} contain inappropriate content. Please review and try again.`,
                    severity: 'error'
                });
                setIsModerating(false);
                return;
            }

            // Show warnings for medium severity content (below 70% but flagged)
            const mediumSeverityContent = [];
            if (nameModeration.action === 'review') mediumSeverityContent.push('Project Name');
            if (taglineModeration.action === 'review') mediumSeverityContent.push('Tagline');
            if (descriptionModeration.action === 'review') mediumSeverityContent.push('Description');

            if (mediumSeverityContent.length > 0) {
                setSnackbar({
                    open: true,
                    message: `⚠️ Warning: ${mediumSeverityContent.join(', ')} flagged for review. Your submission will be monitored by moderators.`,
                    severity: 'warning'
                });
                // Continue with submission (content will be auto-reported to admin)
            }
        } catch (error) {
            console.error('Moderation check failed:', error);
            // Continue with submission if moderation fails
        } finally {
            setIsModerating(false);
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

            // Validate required fields before submission
            if (!formData.name || !formData.websiteUrl || !formData.description || !formData.tagline) {
                throw new Error('Missing required fields: name, website URL, description, or tagline');
            }

            if (!selectedCategory) {
                throw new Error('Please select a category for your startup');
            }

            if (logoFile && typeof logoFile !== 'string') {
                // User uploaded file - preserve quality and upload
                try {
                    const qualityFile = await preserveImageQuality(logoFile);
                    const logoPath = `${Date.now()}-logo-${sanitizeFileName(logoFile.name)}`;
                    const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, qualityFile);
                    if (logoErrorUpload) {
                        console.error('Logo upload error:', logoErrorUpload);
                        throw new Error(`Logo upload failed: ${logoErrorUpload.message}`);
                    }
                    const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                    logoUrl = logoUrlData.publicUrl;
                } catch (error) {
                    console.error('Logo quality preservation failed, uploading original:', error);
                    // Fallback to original file if quality preservation fails
                    const logoPath = `${Date.now()}-logo-${sanitizeFileName(logoFile.name)}`;
                    const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, logoFile);
                    if (logoErrorUpload) {
                        console.error('Logo upload error:', logoErrorUpload);
                        throw new Error(`Logo upload failed: ${logoErrorUpload.message}`);
                    }
                    const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                    logoUrl = logoUrlData.publicUrl;
                }
            } else if (logoFile && typeof logoFile === 'string') {
                // AI-generated logo URL - download and upload to our storage
                try {
                    console.log('🔄 Processing AI-generated logo:', logoFile);
                    console.log('📥 Fetching logo from URL...');
                    
                    const response = await fetch(logoFile);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch AI logo: ${response.status}`);
                    }
                    
                    console.log('✅ Logo fetched successfully, converting to blob...');
                    const blob = await response.blob();
                    console.log('📦 Blob created:', blob.size, 'bytes, type:', blob.type);
                    
                    const aiLogoFile = new File([blob], 'ai-generated-logo.png', { type: blob.type || 'image/png' });
                    console.log('📁 File created:', aiLogoFile.name, 'size:', aiLogoFile.size);

                    // Preserve quality and upload
                    console.log('🎨 Preserving image quality...');
                    const qualityFile = await preserveImageQuality(aiLogoFile);
                    console.log('✨ Quality preserved, uploading to Supabase...');
                    
                    const logoPath = `${Date.now()}-ai-logo-${nanoid(6)}.png`;
                    const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, qualityFile);
                    
                    if (logoErrorUpload) {
                        console.error('❌ AI logo upload error:', logoErrorUpload);
                        throw new Error(`AI logo upload failed: ${logoErrorUpload.message}`);
                    }
                    
                    console.log('✅ Logo uploaded to Supabase, getting public URL...');
                    const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                    logoUrl = logoUrlData.publicUrl;
                    console.log('🎉 AI logo successfully uploaded to:', logoUrl);
                } catch (error) {
                    console.error('❌ AI logo processing failed:', error);
                    console.log('🔄 Falling back to original AI logo URL:', logoFile);
                    // Keep the original AI logo URL as fallback
                    logoUrl = logoFile;
                }
            }
            submissionData.logo_url = logoUrl;

            if (thumbnailFile && typeof thumbnailFile !== 'string') {
                // User uploaded file - preserve quality and upload
                try {
                    const qualityFile = await preserveImageQuality(thumbnailFile);
                    const thumbPath = `${Date.now()}-thumbnail-${sanitizeFileName(thumbnailFile.name)}`;
                    const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, qualityFile);
                    if (thumbError) {
                        console.error('Thumbnail upload error:', thumbError);
                        throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
                    }
                    const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                    thumbnailUrl = thumbUrlData.publicUrl;
                } catch (error) {
                    console.error('Thumbnail quality preservation failed, uploading original:', error);
                    // Fallback to original file if quality preservation fails
                    const thumbPath = `${Date.now()}-thumbnail-${sanitizeFileName(thumbnailFile.name)}`;
                    const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, thumbnailFile);
                    if (thumbError) {
                        console.error('Thumbnail upload error:', thumbError);
                        throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
                    }
                    const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                    thumbnailUrl = thumbUrlData.publicUrl;
                }
            } else if (thumbnailFile && typeof thumbnailFile === 'string') {
                // AI-generated thumbnail URL - download and upload to our storage
                try {
                    console.log('Processing AI-generated thumbnail:', thumbnailFile);
                    const response = await fetch(thumbnailFile);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch AI thumbnail: ${response.status}`);
                    }

                    const blob = await response.blob();
                    const aiThumbnailFile = new File([blob], 'ai-generated-thumbnail.png', { type: blob.type || 'image/png' });

                    // Preserve quality and upload
                    const qualityFile = await preserveImageQuality(aiThumbnailFile);
                    const thumbPath = `${Date.now()}-ai-thumbnail-${nanoid(6)}.png`;
                    const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, qualityFile);
                    if (thumbError) {
                        console.error('AI thumbnail upload error:', thumbError);
                        throw new Error(`AI thumbnail upload failed: ${thumbError.message}`);
                    }
                    const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                    thumbnailUrl = thumbUrlData.publicUrl;
                    console.log('AI thumbnail successfully uploaded to:', thumbnailUrl);
                } catch (error) {
                    console.error('AI thumbnail processing failed:', error);
                    // Keep the original AI thumbnail URL as fallback
                    thumbnailUrl = thumbnailFile;
                }
            }
            submissionData.thumbnail_url = thumbnailUrl;

            if (coverFiles && coverFiles.length > 0) {
                for (let i = 0; i < coverFiles.length; i++) {
                    const file = coverFiles[i];
                    if (file && typeof file !== 'string') {
                        // User uploaded file - preserve quality and upload
                        try {
                            const qualityFile = await preserveImageQuality(file);
                            const coverPath = `${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
                            const { data: coverData, error: coverErrorUpload } = await supabase.storage.from('startup-media').upload(coverPath, qualityFile);
                            if (coverErrorUpload) {
                                console.error('Cover file upload error:', coverErrorUpload);
                                throw new Error(`Cover file upload failed: ${coverErrorUpload.message}`);
                            }
                            const { data: coverUrlData } = supabase.storage.from('startup-media').getPublicUrl(coverPath);
                            coverUrls.push(coverUrlData.publicUrl);
                        } catch (error) {
                            console.error('Cover quality preservation failed, uploading original:', error);
                            // Fallback to original file if quality preservation fails
                            const coverPath = `${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
                            const { data: coverData, error: coverErrorUpload } = await supabase.storage.from('startup-media').upload(coverPath, file);
                            if (coverErrorUpload) {
                                console.error('Cover file upload error:', coverErrorUpload);
                                throw new Error(`Cover file upload failed: ${coverErrorUpload.message}`);
                            }
                            const { data: coverUrlData } = supabase.storage.from('startup-media').getPublicUrl(coverPath);
                            coverUrls.push(coverUrlData.publicUrl);
                        }
                    } else if (typeof file === 'string') {
                        coverUrls.push(file);
                    }
                }
            }
            submissionData.cover_urls = coverUrls;

            // Log submission data for debugging
            console.log('🔍 FINAL SUBMISSION DATA DEBUG:');
            console.log('📝 Form Data:', formData);
            console.log('🖼️ Logo File State:', logoFile);
            console.log('🖼️ Logo File Type:', typeof logoFile);
            console.log('🔗 Final Logo URL:', logoUrl);
            console.log('🔗 Final Thumbnail URL:', thumbnailUrl);
            console.log('📁 Cover Files:', coverFiles);
            console.log('📁 Final Cover URLs:', coverUrls);
            console.log('📊 Complete Submission Data:', submissionData);
            console.log('🎯 Logo URL in submissionData:', submissionData.logo_url);
            console.log('🎯 Thumbnail URL in submissionData:', submissionData.thumbnail_url);
            console.log('🎯 Cover URLs in submissionData:', submissionData.cover_urls);

            let finalSubmissionData;
            if (isEditing && editingProjectId) {
                submissionData.status = 'launched';
                const { data, error } = await supabase.from('projects').update(submissionData).eq('id', editingProjectId).select().single();
                if (error) {
                    console.error('Update error:', error);
                    throw new Error(`Update failed: ${error.message}`);
                }
                finalSubmissionData = data;
            } else {
                const { data, error } = await supabase.from('projects').insert([submissionData]).select().single();
                if (error) {
                    console.error('Insert error:', error);
                    throw new Error(`Insert failed: ${error.message}`);
                }
                finalSubmissionData = data;
            }

            setSnackbar({ open: true, message: 'Launch submitted successfully!', severity: 'success' });

            // Show admin approval alert
            setTimeout(() => {
                setSnackbar({
                    open: true,
                    message: '⏳ Your launch is now pending admin approval. You will be notified once it\'s approved and visible to the community!',
                    severity: 'info'
                });
            }, 2000);

            setTimeout(() => {
                navigate(`/launches/${finalSubmissionData.slug}`);
            }, 1000);

            // Complete form reset
            setFormData({ name: '', websiteUrl: '', description: '', tagline: '' });
            setSelectedCategory(null);
            setLinks(['']);
            setTags([]);
            setLogoFile(null);
            setThumbnailFile(null);
            setCoverFiles([null, null, null, null]);
            setEditingProjectId(null);
            setUrlPreview(null);
            setPendingAIData(null);
            setShowSmartFillDialog(false);
            setRetryCount(0);
            setIsAILoading(false);
            setIsRetrying(false);
            setIsGeneratingPreview(false);
        } catch (error) {
            console.error('Error submitting form:', error);

            // Provide more specific error messages
            let errorMessage = 'Failed to register startup. Please try again.';
            let severity = 'error';

            if (error.message) {
                if (error.message.includes('Missing required fields')) {
                    errorMessage = `❌ ${error.message}`;
                } else if (error.message.includes('upload failed')) {
                    errorMessage = `📁 ${error.message}`;
                } else if (error.message.includes('Insert failed') || error.message.includes('Update failed')) {
                    errorMessage = `💾 Database error: ${error.message}`;
                } else if (error.message.includes('duplicate key')) {
                    errorMessage = '⚠️ A startup with this name already exists. Please choose a different name.';
                    severity = 'warning';
                } else if (error.message.includes('violates')) {
                    errorMessage = '⚠️ Some data is invalid. Please check your inputs and try again.';
                    severity = 'warning';
                } else {
                    errorMessage = `❌ ${error.message}`;
                }
            }

            setSnackbar({ open: true, message: errorMessage, severity });
        }
    };

    const generateBasicPreview = async (url) => {
        setIsGeneratingPreview(true);
        try {
            // Try to get basic metadata from the URL
            const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true&screenshot=true&embed=screenshot.url`);
            const data = await response.json();

            if (data.status === 'success') {
                const preview = {
                    title: data.data.title || 'Website Title',
                    description: data.data.description || 'No description available',
                    logo: data.data.logo?.url || null,
                    screenshot: data.data.screenshot?.url || null,
                    domain: new URL(url).hostname
                };
                setUrlPreview(preview);

                // Auto-fill basic fields with preview data
                setFormData(prev => ({
                    ...prev,
                    name: prev.name || preview.title,
                    description: prev.description || preview.description
                }));

                if (preview.logo && !logoFile) {
                    setLogoFile(preview.logo);
                }

                if (preview.screenshot && !thumbnailFile) {
                    setThumbnailFile(preview.screenshot);
                }

                setSnackbar({
                    open: true,
                    message: `📱 Basic preview generated from ${preview.domain}`,
                    severity: 'success'
                });
            }
        } catch (error) {
            console.log('Basic preview failed, continuing with manual input');
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const handleGenerateLaunchData = async (isRetry = false) => {
        if (!formData.websiteUrl) {
            setSnackbar({ open: true, message: "Please enter a website URL first.", severity: 'warning' });
            return;
        }

        if (isRetry) {
            setIsRetrying(true);
            setRetryCount(prev => prev + 1);
        } else {
            setIsAILoading(true);
            setRetryCount(0);
        }

        const startTime = Date.now();
        const loadingMessage = isRetry
            ? `🔄 Retrying AI generation (attempt ${retryCount + 1})...`
            : "🤖 AI is analyzing your website... This may take up to 25 seconds.";

        setSnackbar({ open: true, message: loadingMessage, severity: 'info' });

        // Add progress updates
        const progressInterval = setInterval(() => {
            if (isAILoading || isRetrying) {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                if (elapsed < 25) {
                    setSnackbar({
                        open: true,
                        message: `🤖 AI is analyzing your website... (${elapsed}s/25s)`,
                        severity: 'info'
                    });
                }
            }
        }, 2000);

        try {
            const { data: userData } = await supabase.auth.getUser();
            const user_id = userData?.user?.id;

            // Create AbortController for timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout (reduced from 45)

            const res = await fetch(config.getBackendUrl() + "/generatelaunchdata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: formData.websiteUrl,
                    user_id,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const gptData = await res.json();

            if (gptData.err || gptData.error) {
                throw new Error(gptData.message || 'AI generation failed');
            }

            // Validate that we got the essential data
            const essentialFields = ['name', 'description', 'tagline'];
            const missingFields = essentialFields.filter(field => !gptData[field]);

            if (missingFields.length > 0) {
                console.warn('Missing essential fields:', missingFields);
                setSnackbar({
                    open: true,
                    message: `⚠️ AI generated partial data. Missing: ${missingFields.join(', ')}`,
                    severity: 'warning'
                });
            }

            // Process AI response with better error handling
            const processedData = {
                name: gptData.name || '',
                website_url: gptData.website_url || formData.websiteUrl,
                tagline: gptData.tagline || '',
                description: gptData.description || '',
                logo_url: gptData.logo_url || null,
                thumbnail_url: gptData.thumbnail_url || null,
                features: gptData.features || [],
                category: gptData.category || null,
                links: gptData.links || []
            };

            // Check how many fields are already filled
            const filledCount = getFilledFieldsCount();

            if (filledCount < 4) {
                // If less than 4 fields filled, directly apply AI data
                applyAIData(processedData, false); // Fill all fields
                setSnackbar({
                    open: true,
                    message: `🤖 AI generated data successfully! ${processedData.name ? `Found: ${processedData.name}` : ''}`,
                    severity: 'success'
                });
            } else {
                // If 4+ fields filled, show dialog for user choice
                setPendingAIData(processedData);
                setShowSmartFillDialog(true);
            }

            // Reset retry count on success
            setRetryCount(0);
        }
        catch (error) {
            console.error("Auto Generate failed:", error);

            let errorMessage = "AI failed to extract startup info...";
            let severity = 'error';
            let showRetry = false;

            if (error.name === 'AbortError') {
                errorMessage = "⏰ AI generation timed out. The website might be complex or slow.";
                severity = 'warning';
                showRetry = retryCount < 2; // Allow up to 2 retries
            } else if (error.message && error.message.includes("Microlink")) {
                errorMessage = "🖼️ AI extracted text but failed to generate logo/thumbnail. You can upload them manually!";
                severity = 'warning';
            } else if (error.message && error.message.includes("OpenAI")) {
                errorMessage = "🤖 AI service temporarily unavailable. Please try again in a few minutes.";
                severity = 'warning';
                showRetry = retryCount < 1; // Allow 1 retry for service issues
            } else if (error.message && error.message.includes("HTTP")) {
                errorMessage = "🌐 Backend service error. Please try again later.";
                severity = 'error';
                showRetry = retryCount < 1;
            } else if (error.message && error.message.includes("fetch")) {
                errorMessage = "🌐 Network error. Please check your connection and try again.";
                severity = 'error';
                showRetry = retryCount < 2;
            }

            // Try to generate basic preview as fallback
            if (!urlPreview && !isGeneratingPreview) {
                generateBasicPreview(formData.websiteUrl);
            }

            setSnackbar({
                open: true,
                message: errorMessage,
                severity,
                action: showRetry ? (
                    <button
                        onClick={() => handleGenerateLaunchData(true)}
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        Retry
                    </button>
                ) : undefined
            });
        } finally {
            setIsAILoading(false);
            setIsRetrying(false);
            clearInterval(progressInterval);
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
                    value: gptData.category ? gptData.category.toLowerCase().replace(/\s+/g, '-') : '',
                    label: gptData.category || '',
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

    // Image quality preservation functions
    const validateImageQuality = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // Check minimum dimensions
                if (img.width < 200 || img.height < 200) {
                    reject(new Error('Image dimensions too small. Minimum size: 200x200px'));
                    return;
                }

                // Check aspect ratio for logo/thumbnail (should be roughly square)
                const aspectRatio = img.width / img.height;
                if (aspectRatio < 0.5 || aspectRatio > 2) {
                    reject(new Error('Logo/thumbnail should have a reasonable aspect ratio (not too wide or tall)'));
                    return;
                }

                resolve(true);
            };

            img.onerror = () => reject(new Error('Invalid image file'));
            img.src = URL.createObjectURL(file);
        });
    };

    const preserveImageQuality = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                try {
                    // Set canvas size to match image dimensions (no resizing)
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Use high-quality rendering
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw image at original size
                    ctx.drawImage(img, 0, 0);

                    // Convert to blob with high quality
                    canvas.toBlob((blob) => {
                        if (blob) {
                            // Create new file with preserved quality
                            const qualityFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(qualityFile);
                        } else {
                            reject(new Error('Failed to process image'));
                        }
                    }, file.type, 1.0); // 1.0 = maximum quality
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Invalid image file'));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleImageUpload = async (file, type) => {
        try {
            // Validate image quality first
            await validateImageQuality(file);

            // Preserve image quality
            const qualityFile = await preserveImageQuality(file);

            // Upload the quality-preserved file
            const timestamp = Date.now();
            const fileName = `${timestamp}-${type}-${sanitizeFileName(file.name)}`;

            const { data, error } = await supabase.storage
                .from('startup-media')
                .upload(fileName, qualityFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                throw new Error(`Upload failed: ${error.message}`);
            }

            const { data: urlData } = supabase.storage
                .from('startup-media')
                .getPublicUrl(fileName);

            return urlData.publicUrl;
        } catch (error) {
            console.error(`${type} upload error:`, error);
            throw error;
        }
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
                .btn-text-icon-secondary {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #6b7280;
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
                            Media & Images
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(3)}
                            className={`px-6 py-3 -mb-px border-b-2 text-sm font-semibold transition-colors duration-200
                                ${step === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Additional Details
                        </button>
                    </nav>

                    <form onSubmit={handleSubmit}>
                        {/* Step-specific content */}
                        {step === 1 && (
                            <div className="form-tab-panel active">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-field-group">
                                            <label className="form-label" htmlFor="name">
                                                Name of the launch <span className="text-red-500">*</span>
                                            </label>
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

                                            {/* Content Moderation will be checked on submit */}
                                        </div>
                                        <div className="form-field-group">
                                            <label className="form-label" htmlFor="websiteUrl">
                                                Website URL <span className="text-red-500">*</span>
                                            </label>
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
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateLaunchData}
                                                    disabled={isAILoading || isRetrying}
                                                    className={`btn-text-icon ${isAILoading || isRetrying ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isAILoading || isRetrying ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                            {isRetrying ? `Retrying... (Attempt ${retryCount + 1})` : 'Generating...'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Wand2 className="w-4 h-4" />
                                                            Auto-generate from URL
                                                        </>
                                                    )}
                                                </button>

                                                {/* Fallback basic preview button */}
                                                {!urlPreview && !isGeneratingPreview && (
                                                    <button
                                                        type="button"
                                                        onClick={() => generateBasicPreview(formData.websiteUrl)}
                                                        disabled={isGeneratingPreview || !formData.websiteUrl}
                                                        className="btn-text-icon-secondary"
                                                        title="Generate basic preview if AI fails"
                                                    >
                                                        {isGeneratingPreview ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                                                Preview...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="w-4 h-4" />
                                                                Basic Preview
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Show preview data if available */}
                                            {urlPreview && (
                                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-medium text-green-800">
                                                            Basic preview available from {urlPreview.domain}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-green-700">
                                                        <p><strong>Title:</strong> {urlPreview.title}</p>
                                                        <p><strong>Description:</strong> {urlPreview.description}</p>
                                                        {urlPreview.logo && <p><strong>Logo:</strong> ✓ Found</p>}
                                                        {urlPreview.screenshot && <p><strong>Screenshot:</strong> ✓ Found</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-field-group">
                                            <label className="form-label" htmlFor="tagline">
                                                Tagline <span className="text-red-500">*</span>
                                            </label>
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

                                            {/* Content Moderation will be checked on submit */}
                                        </div>
                                        <div className="form-field-group">
                                            <label className="form-label" htmlFor="category">
                                                Category(ies) <span className="text-red-500">*</span>
                                            </label>
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
                                            <label className="form-label" htmlFor="description">
                                                Description <span className="text-red-500">*</span>
                                            </label>
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

                                            {/* Content Moderation will be checked on submit */}
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
                                            <label className="form-label">
                                                Logo
                                                {(!urlPreview || (!urlPreview.logo && !urlPreview.screenshot)) && (
                                                    <span className="text-red-500">*</span>
                                                )}
                                                {urlPreview && (urlPreview.logo || urlPreview.screenshot) && (
                                                    <span className="text-green-500 text-xs ml-2">✓ AI Generated</span>
                                                )}
                                            </label>
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
                                                    {(!urlPreview || (!urlPreview.logo && !urlPreview.screenshot)) && (
                                                        <div className="text-red-600 font-medium">Required if AI generation fails</div>
                                                    )}
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
                                            <label className="form-label">
                                                Thumbnail (Dashboard)
                                                {(!urlPreview || (!urlPreview.logo && !urlPreview.screenshot)) && (
                                                    <span className="text-red-500">*</span>
                                                )}
                                                {urlPreview && (urlPreview.logo || urlPreview.screenshot) && (
                                                    <span className="text-green-500 text-xs ml-2">✓ AI Generated</span>
                                                )}
                                            </label>
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
                                            <label className="form-label">
                                                Cover image(s) <span className="text-red-500">*</span>
                                            </label>
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
                                                <span className="text-red-600 font-medium">Required: At least 2 cover images</span><br />
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
                                    disabled={isModerating}
                                    className={`btn-primary ${isModerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isModerating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Checking Content...
                                        </>
                                    ) : (
                                        'Submit Launch'
                                    )}
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