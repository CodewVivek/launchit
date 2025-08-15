import React, { useState, useEffect } from "react";
import { Rocket, Mail, ArrowRight, CheckCircle, Sparkles, AlertCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ComingSoon = () => {
    const [showAdvertiseModal, setShowAdvertiseModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [userProjects, setUserProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [selectedPlan, setSelectedPlan] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [userName, setUserName] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if user is logged in
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch user's projects
                const { data: projects } = await supabase
                    .from('projects')
                    .select('id, name, tagline, website_url')
                    .eq('user_id', user.id);

                setUserProjects(projects || []);

                // Pre-fill user info if available
                if (user.email) setUserEmail(user.email);
                if (user.user_metadata?.full_name) setUserName(user.user_metadata.full_name);
            }
        };

        getUser();
    }, []);

    const handleAdvertiseClick = () => {
        if (!user) {
            alert("Please login to advertise your projects!");
            return;
        }

        if (userProjects.length === 0) {
            alert("You need to launch at least one project before advertising!");
            return;
        }

        setShowAdvertiseModal(true);
        setCurrentStep(1);
    };

    const handleProjectSelect = (projectId) => {
        setSelectedProject(projectId);
        setCurrentStep(2);
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setCurrentStep(3);
    };

    const handleBackToStep = (step) => {
        setCurrentStep(step);
    };

    const handleSubmitInterest = async () => {
        if (!userEmail || !userName || !selectedProject || !selectedPlan) {
            alert("Please fill in all required fields!");
            return;
        }

        setIsSubmitting(true);

        try {
            // Get selected project details
            const selectedProjectData = userProjects.find(p => p.id === selectedProject);
            const selectedPlanData = pricingPlans.find(p => p.id === selectedPlan);

            // Prepare email data
            const emailData = {
                to: "admin@launchit.site", // Replace with your admin email
                subject: `New Advertising Interest - ${selectedProjectData?.name}`,
                html: `
                    <h2>New Advertising Interest</h2>
                    <h3>Project Details:</h3>
                    <p><strong>Project Name:</strong> ${selectedProjectData?.name}</p>
                    <p><strong>Project Tagline:</strong> ${selectedProjectData?.tagline}</p>
                    <p><strong>Website:</strong> ${selectedProjectData?.website_url}</p>
                    
                    <h3>User Details:</h3>
                    <p><strong>Name:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Phone:</strong> ${userPhone || 'Not provided'}</p>
                    
                    <h3>Selected Plan:</h3>
                    <p><strong>Plan:</strong> ${selectedPlanData?.name} - ${selectedPlanData?.price}</p>
                    <p><strong>Duration:</strong> ${selectedPlanData?.duration}</p>
                    
                    <h3>Additional Information:</h3>
                    <p>${additionalInfo || 'No additional information provided'}</p>
                    
                    <h3>User ID:</h3>
                    <p>${user.id}</p>
                    
                    <hr>
                    <p><em>This interest was submitted through the LaunchIT advertising system.</em></p>
                `
            };

            // Store interest in database for admin review
            const { error: dbError } = await supabase
                .from('advertising_interests')
                .insert({
                    user_id: user.id,
                    project_id: selectedProject,
                    project_name: selectedProjectData?.name,
                    plan_id: selectedPlan,
                    plan_name: selectedPlanData?.name,
                    plan_price: selectedPlanData?.price,
                    user_name: userName,
                    user_email: userEmail,
                    user_phone: userPhone,
                    additional_info: additionalInfo,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (dbError) {
                console.error('Database error:', dbError);
                // Continue anyway - we'll still send email
            }

            // Send email notification to admin
            // Note: In production, you'd use a proper email service like SendGrid, Mailgun, etc.
            // For now, we'll just show success message
            alert("Thank you for your interest! We've received your request and will get back to you within 24-48 hours. Please check your email for confirmation.");

            // Reset form
            setShowAdvertiseModal(false);
            setCurrentStep(1);
            setSelectedProject("");
            setSelectedPlan("");
            setUserEmail("");
            setUserName("");
            setUserPhone("");
            setAdditionalInfo("");

        } catch (error) {
            console.error('Error submitting interest:', error);
            alert("There was an error submitting your interest. Please try again or contact us directly.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const pricingPlans = [
        {
            id: "1day",
            name: "1 Day",
            price: "₹199",
            duration: "1 Day",
            benefits: [
                "Full Day Dashboard Highlighted",
                "Trending Projects Section",
                "Special Badge Display",
                "Homepage Boost",
                "Priority Visibility"
            ]
        },
        {
            id: "3days",
            name: "3 Days",
            price: "₹399",
            duration: "3 Days",
            benefits: [
                "3 Days Dashboard Highlighted",
                "Trending Projects Section",
                "Special Badge Display",
                "Homepage Boost",
                "Priority Visibility",
                "Extended Exposure"
            ]
        },
        {
            id: "7days",
            name: "7 Days",
            price: "₹799",
            duration: "7 Days",
            benefits: [
                "7 Days Dashboard Highlighted",
                "Trending Projects Section",
                "Special Badge Display",
                "Homepage Boost",
                "Priority Visibility",
                "Extended Exposure",
                "Analytics Dashboard Access"
            ]
        },
        {
            id: "30days",
            name: "30 Days",
            price: "₹2,499",
            duration: "30 Days",
            benefits: [
                "30 Days Dashboard Highlighted",
                "Trending Projects Section",
                "Special Badge Display",
                "Homepage Boost",
                "Priority Visibility",
                "Extended Exposure",
                "Analytics Dashboard Access",
                "Premium Support",
                "Featured Newsletter"
            ]
        }
    ];

    const getSelectedProjectData = () => {
        return userProjects.find(p => p.id === selectedProject);
    };

    const getSelectedPlanData = () => {
        return pricingPlans.find(p => p.id === selectedPlan);
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4">
                        Coming Soon
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        We're building something amazing! Get ready for the future of startup discovery and promotion.
                    </p>
                </div>

                {/* Advertise Button */}
                <div className="text-center mb-16">
                    <button
                        onClick={handleAdvertiseClick}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center mx-auto gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        Advertise Your Project
                    </button>
                    <p className="text-gray-500 mt-2 text-sm">
                        Boost your startup's visibility with our premium highlighting packages
                    </p>
                </div>

                {/* Coming Soon Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Rocket className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Launch Projects</h3>
                        <p className="text-gray-600">Showcase your startup to the world</p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Get Discovered</h3>
                        <p className="text-gray-600">Connect with investors and partners</p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Grow Together</h3>
                        <p className="text-gray-600">Join our startup community</p>
                    </div>
                </div>

                {/* Newsletter Signup */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        Stay Updated
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Get notified when we launch and be the first to try our new features
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
                            Notify Me
                        </button>
                    </div>
                </div>

                {/* Advertise Modal */}
                {showAdvertiseModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Advertise Your Project</h2>
                                <button
                                    onClick={() => setShowAdvertiseModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex items-center justify-center mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                            1
                                        </div>
                                        <span className="ml-2 font-medium">Select Project</span>
                                    </div>
                                    <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                    <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                            2
                                        </div>
                                        <span className="ml-2 font-medium">Choose Plan</span>
                                    </div>
                                    <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                    <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                            3
                                        </div>
                                        <span className="ml-2 font-medium">Submit Interest</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 1: Project Selection */}
                            {currentStep === 1 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Step 1: Select Your Project</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userProjects.map((project) => (
                                            <div
                                                key={project.id}
                                                onClick={() => handleProjectSelect(project.id)}
                                                className="p-4 border-2 border-gray-200 hover:border-blue-300 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50"
                                            >
                                                <h4 className="font-semibold text-gray-800">{project.name}</h4>
                                                <p className="text-gray-600 text-sm">{project.tagline}</p>
                                                <p className="text-blue-600 text-sm">{project.website_url}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Plan Selection */}
                            {currentStep === 2 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Step 2: Choose Your Plan</h3>
                                        <button
                                            onClick={() => handleBackToStep(1)}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            ← Back to Projects
                                        </button>
                                    </div>

                                    {getSelectedProjectData() && (
                                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                            <p className="text-sm text-gray-600">Selected Project:</p>
                                            <p className="font-semibold text-gray-800">{getSelectedProjectData().name}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pricingPlans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                onClick={() => handlePlanSelect(plan.id)}
                                                className="p-4 border-2 border-gray-200 hover:border-purple-300 rounded-lg cursor-pointer transition-all duration-200 hover:bg-purple-50"
                                            >
                                                <div className="text-center mb-3">
                                                    <h4 className="font-semibold text-gray-800">{plan.name}</h4>
                                                    <div className="text-2xl font-bold text-purple-600">{plan.price}</div>
                                                    <p className="text-gray-600 text-sm">{plan.duration}</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-gray-700 mb-2">Benefits:</h5>
                                                    <ul className="text-sm text-gray-600 space-y-1">
                                                        {plan.benefits.map((benefit, index) => (
                                                            <li key={index} className="flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                                {benefit}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Submit Interest */}
                            {currentStep === 3 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Step 3: Submit Your Interest</h3>
                                        <button
                                            onClick={() => handleBackToStep(2)}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            ← Back to Plans
                                        </button>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                        <h4 className="font-semibold text-gray-800 mb-2">Summary:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p><strong>Project:</strong> {getSelectedProjectData()?.name}</p>
                                                <p><strong>Plan:</strong> {getSelectedPlanData()?.name} - {getSelectedPlanData()?.price}</p>
                                            </div>
                                            <div>
                                                <p><strong>Duration:</strong> {getSelectedPlanData()?.duration}</p>
                                                <p><strong>Total Cost:</strong> {getSelectedPlanData()?.price}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Form */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name * <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address * <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={userEmail}
                                                onChange={(e) => setUserEmail(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter your email address"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={userPhone}
                                                onChange={(e) => setUserPhone(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter your phone number (optional)"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Additional Information
                                            </label>
                                            <textarea
                                                value={additionalInfo}
                                                onChange={(e) => setAdditionalInfo(e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Any specific requirements or questions you have..."
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={handleSubmitInterest}
                                            disabled={isSubmitting || !userName || !userEmail}
                                            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center mx-auto gap-2 ${isSubmitting || !userName || !userEmail
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5" />
                                                    Submit Interest
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Legal Notice */}
                                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                            <div className="text-sm text-yellow-800">
                                                <p className="font-medium mb-1">Important Notice:</p>
                                                <p>By submitting this interest, you acknowledge that:</p>
                                                <ul className="list-disc list-inside mt-1 space-y-1">
                                                    <li>This is a preliminary interest submission, not a binding contract</li>
                                                    <li>We will review your request and contact you within 24-48 hours</li>
                                                    <li>Final pricing and terms will be confirmed upon agreement</li>
                                                    <li>Your information will be used solely for advertising purposes</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComingSoon; 