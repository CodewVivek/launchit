import React from 'react';

const FormActions = ({ step, setStep, handleSaveDraft, handleSubmit }) => {
    return (
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
    );
};

export default FormActions;

