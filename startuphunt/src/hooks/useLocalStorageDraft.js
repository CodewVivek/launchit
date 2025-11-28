import { useEffect } from 'react';
import { isFormEmpty } from '../utils/formValidation';

export const useLocalStorageDraft = (isEditing, formData, selectedCategory, links, setFormData, setSelectedCategory, setLinks, setHasUnsavedChanges) => {
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
};

