import { useState } from 'react';

export const useRegisterForm = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        websiteUrl: '',
        description: '',
        tagline: '',
        categoryOptions: '',
    });
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [links, setLinks] = useState(['']);
    const [builtWith, setBuiltWith] = useState([]);
    const [tags, setTags] = useState([]);
    const [logoFile, setLogoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [coverFiles, setCoverFiles] = useState([null, null, null, null]);
    const [descriptionWordCount, setDescriptionWordCount] = useState(0);
    const [taglineCharCount, setTaglineCharCount] = useState(0);
    const [urlError, setUrlError] = useState('');
    const [dynamicCategoryOptions, setDynamicCategoryOptions] = useState(null);

    const DESCRIPTION_WORD_LIMIT = 260;

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

    const handleLogoChange = async (e, optimizeImage) => {
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

    return {
        step,
        setStep,
        formData,
        setFormData,
        selectedCategory,
        setSelectedCategory,
        links,
        setLinks,
        builtWith,
        setBuiltWith,
        tags,
        setTags,
        logoFile,
        setLogoFile,
        thumbnailFile,
        setThumbnailFile,
        coverFiles,
        setCoverFiles,
        descriptionWordCount,
        taglineCharCount,
        urlError,
        setUrlError,
        dynamicCategoryOptions,
        setDynamicCategoryOptions,
        DESCRIPTION_WORD_LIMIT,
        handleInputChange,
        handleDescriptionChange,
        handleTaglineChange,
        addLink,
        updateLink,
        removeLink,
        handleLogoChange,
        removeLogo,
        handleThumbnailChange,
        removeThumbnail,
        handleCoverChange,
        removeCover,
    };
};

