import { nanoid } from 'nanoid';
import { slugify, sanitizeFileName } from './registerUtils';
import { preserveImageQuality } from './imageHandling';

export const handleFormSubmission = async ({
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
}) => {
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
        user_id: user.id,
        updated_at: new Date().toISOString(),
        status: 'launched',
    };

    // Only set created_at for new projects, not when editing
    if (!isEditing) {
        submissionData.created_at = new Date().toISOString();
    }

    // Only generate new slug for new projects, not when editing
    if (!isEditing) {
        const baseSlug = slugify(formData.name);
        const uniqueSlug = `${baseSlug}-${nanoid(6)}`;
        submissionData.slug = uniqueSlug;
    }

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

                // Verify quality was maintained
                if (qualityFile.size < logoFile.size * 0.8) {
                    throw new Error('Quality preservation resulted in significant size reduction');
                }

                const logoPath = `${Date.now()}-logo-${sanitizeFileName(logoFile.name)}`;
                const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, qualityFile);
                if (logoErrorUpload) {
                    throw new Error(`Logo upload failed: ${logoErrorUpload.message}`);
                }
                const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                logoUrl = logoUrlData.publicUrl;
            } catch (error) {
                // Fallback to original file if quality preservation fails
                const logoPath = `${Date.now()}-logo-${sanitizeFileName(logoFile.name)}`;
                const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, logoFile);
                if (logoErrorUpload) {
                    throw new Error(`Logo upload failed: ${logoErrorUpload.message}`);
                }
                const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                logoUrl = logoUrlData.publicUrl;
            }
        } else if (logoFile && typeof logoFile === 'string') {
            try {
                const response = await fetch(logoFile);
                if (!response.ok) {
                    throw new Error(`Failed to fetch AI logo: ${response.status}`);
                }

                const blob = await response.blob();
                const aiLogoFile = new File([blob], 'ai-generated-logo.png', { type: blob.type || 'image/png' });

                // Preserve quality and upload
                const qualityFile = await preserveImageQuality(aiLogoFile);

                const logoPath = `${Date.now()}-ai-logo-${nanoid(6)}.png`;
                const { data: logoData, error: logoErrorUpload } = await supabase.storage.from('startup-media').upload(logoPath, qualityFile);

                if (logoErrorUpload) {
                    throw new Error(`AI logo upload failed: ${logoErrorUpload.message}`);
                }

                const { data: logoUrlData } = supabase.storage.from('startup-media').getPublicUrl(logoPath);
                logoUrl = logoUrlData.publicUrl;
            } catch (error) {
                logoUrl = logoFile;
            }
        }
        submissionData.logo_url = logoUrl;

        if (thumbnailFile && typeof thumbnailFile !== 'string') {
            // User uploaded file - preserve quality and upload
            try {
                const qualityFile = await preserveImageQuality(thumbnailFile);

                // Verify quality was maintained
                if (qualityFile.size < thumbnailFile.size * 0.8) {
                    throw new Error('Quality preservation resulted in significant size reduction');
                }

                const thumbPath = `${Date.now()}-thumbnail-${sanitizeFileName(thumbnailFile.name)}`;
                const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, qualityFile);
                if (thumbError) {
                    throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
                }
                const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                thumbnailUrl = thumbUrlData.publicUrl;
            } catch (error) {
                // Fallback to original file if quality preservation fails
                const thumbPath = `${Date.now()}-thumbnail-${sanitizeFileName(thumbnailFile.name)}`;
                const { data: thumbData, error: thumbError } = await supabase.storage.from('startup-media').upload(thumbPath, thumbnailFile);
                if (thumbError) {
                    throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
                }
                const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                thumbnailUrl = thumbUrlData.publicUrl;
            }
        } else if (thumbnailFile && typeof thumbnailFile === 'string') {
            // AI-generated thumbnail URL - download and upload to our storage
            try {
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
                    throw new Error(`AI thumbnail upload failed: ${thumbError.message}`);
                }
                const { data: thumbUrlData } = supabase.storage.from('startup-media').getPublicUrl(thumbPath);
                thumbnailUrl = thumbUrlData.publicUrl;
            } catch (error) {
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

                        // Verify quality was maintained
                        if (qualityFile.size < file.size * 0.8) {
                            throw new Error('Quality preservation resulted in significant size reduction');
                        }

                        const coverPath = `${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
                        const { data: coverData, error: coverErrorUpload } = await supabase.storage.from('startup-media').upload(coverPath, qualityFile);
                        if (coverErrorUpload) {
                            throw new Error(`Cover file upload failed: ${coverErrorUpload.message}`);
                        }
                        const { data: coverUrlData } = supabase.storage.from('startup-media').getPublicUrl(coverPath);
                        coverUrls.push(coverUrlData.publicUrl);
                    } catch (error) {
                        // Fallback to original file if quality preservation fails
                        const coverPath = `${Date.now()}-cover-${i}-${sanitizeFileName(file.name)}`;
                        const { data: coverData, error: coverErrorUpload } = await supabase.storage.from('startup-media').upload(coverPath, file);
                        if (coverErrorUpload) {
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

        let finalSubmissionData;
        if (isEditing && editingProjectId) {
            submissionData.status = 'launched';
            const { data, error } = await supabase.from('projects').update(submissionData).eq('id', editingProjectId).select().maybeSingle();
            if (error) {
                throw new Error(`Update failed: ${error.message}`);
            }
            finalSubmissionData = data;
        } else {
            const { data, error } = await supabase.from('projects').insert([submissionData]).select().maybeSingle();
            if (error) {
                throw new Error(`Insert failed: ${error.message}`);
            }
            finalSubmissionData = data;
        }

        const message = isEditing ? 'Project updated successfully!' : 'Launch submitted successfully!';
        setSnackbar({ open: true, message, severity: 'success' });

        // Show admin approval alert only for new launches
        if (!isEditing) {
            setTimeout(() => {
                setSnackbar({
                    open: true,
                    message: '⏳ Your launch is now pending admin approval. You will be notified once it\'s approved and visible to the community!',
                    severity: 'info'
                });
            }, 2000);
        }

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

