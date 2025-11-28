export const applyAIData = ({
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
}) => {
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

            const updatedCategoryOptions = [...dynamicCategoryOptions];
            const emergingTechIndex = updatedCategoryOptions.findIndex(
                group => group.label === "🧪 Emerging Technologies"
            );

            if (emergingTechIndex !== -1) {
                updatedCategoryOptions[emergingTechIndex].options.push(categoryOption);
            } else {
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

