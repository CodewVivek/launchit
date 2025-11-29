import { config } from '../config';

export const generateLaunchData = async ({
    websiteUrl,
    supabase,
    setSnackbar,
    setIsAILoading,
    setIsRetrying,
    setRetryCount,
    retryCount,
    isRetry,
    formData,
    getFilledFieldsCount,
    applyAIData,
    setPendingAIData,
    setShowSmartFillDialog,
    urlPreview,
    isGeneratingPreview,
    generateBasicPreview,
}) => {
    if (!websiteUrl) {
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

    const loadingMessage = isRetry
        ? 'Generating...'
        : "🤖 AI is analyzing your website...";

    setSnackbar({ open: true, message: loadingMessage, severity: 'info' });

    // Add progress updates (steady message without timer)
    const progressInterval = setInterval(() => {
        if (isAILoading || isRetrying) {
            setSnackbar({
                open: true,
                message: '🤖 AI is analyzing your website...',
                severity: 'info'
            });
        }
    }, 5000);

    try {
        let user_id = null;
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                console.error('Error fetching auth user for AI generation:', error);
            } else {
                user_id = data?.user?.id || null;
            }
        } catch (authError) {
            console.error('Unexpected auth error for AI generation:', authError);
        }

        //fetch the website and get the html
        const res = await fetch(config.getBackendUrl() + "/generatelaunchdata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: websiteUrl,
                user_id,
            })
        });

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
            setSnackbar({
                open: true,
                message: `⚠️ AI generated partial data. Missing: ${missingFields.join(', ')}`,
                severity: 'warning'
            });
        }

        // Process AI response with better error handling
        const processedData = {
            name: gptData.name || '',
            website_url: gptData.website_url || websiteUrl,
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
            setPendingAIData(processedData);
            setShowSmartFillDialog(true);
        }

        // Reset retry count on success
        setRetryCount(0);
    }
    catch (error) {
        let errorMessage = "AI failed to extract startup info...";
        let severity = 'error';
        let showRetry = false;

        if (error.message && error.message.includes("Microlink")) {
            errorMessage = "🖼️ AI extracted text but failed to generate logo/thumbnail. You can upload them manually!";
            severity = 'warning';
        } else if (error.message && error.message.includes("OpenAI")) {
            errorMessage = "🤖 AI service temporarily unavailable. Please try again in a few minutes.";
            severity = 'warning';
            showRetry = true;
        } else if (error.message && error.message.includes("HTTP")) {
            errorMessage = "🌐 Backend service error. Please try again later.";
            severity = 'error';
            showRetry = true;
        } else if (error.message && error.message.includes("fetch")) {
            errorMessage = "🌐 Network error. Please check your connection and try again.";
            severity = 'error';
            showRetry = true;
        }

        // Try to generate basic preview as fallback
        if (!urlPreview && !isGeneratingPreview) {
            generateBasicPreview(websiteUrl);
        }

        if (showRetry) {
            // Auto-retry with exponential backoff capped at 30s
            setIsRetrying(true);
            const nextDelay = Math.min(30000, 2000 * (retryCount + 1));
            setRetryCount(prev => prev + 1);
            setTimeout(() => generateLaunchData({
                websiteUrl,
                supabase,
                setSnackbar,
                setIsAILoading,
                setIsRetrying,
                setRetryCount,
                retryCount,
                isRetry: true,
                formData,
                getFilledFieldsCount,
                applyAIData,
                setPendingAIData,
                setShowSmartFillDialog,
                urlPreview,
                isGeneratingPreview,
                generateBasicPreview,
            }), nextDelay);
        } else {
            setSnackbar({ open: true, message: errorMessage, severity });
        }
    } finally {
        setIsAILoading(false);
        setIsRetrying(false);
        clearInterval(progressInterval);
    }
};

