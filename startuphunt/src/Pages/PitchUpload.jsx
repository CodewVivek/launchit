import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import { Eye, Play } from "lucide-react";

export default function PitchUpload() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [videoType, setVideoType] = useState("link"); // 'link' or 'file'
    const [videoUrl, setVideoUrl] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [user, setUser] = useState(null);
    const [approvedPitches, setApprovedPitches] = useState([]);
    const [loadingApprovedPitches, setLoadingApprovedPitches] = useState(true);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [selectedFileSize, setSelectedFileSize] = useState("");

    // Fetch user on mount
    useEffect(() => {
        async function fetchUser() {
            const { data } = await supabase.auth.getUser();
            setUser(data?.user || null);
        }
        fetchUser();
    }, []);

    // Fetch user's projects
    useEffect(() => {
        async function fetchProjects() {
            if (!user) return;
            const { data, error } = await supabase
                .from("projects")
                .select("id, name")
                .eq("user_id", user.id)
                .neq("status", "draft");
            if (!error) setProjects(data || []);
        }
        fetchProjects();
    }, [user]);

    // Fetch approved pitches
    const fetchApprovedPitches = async () => {
        setLoadingApprovedPitches(true);
        try {
            const { data: pitchesData, error: pitchesError } = await supabase
                .from("pitch_submissions")
                .select(`*,projects:project_id (
                        id, 
                        name, 
                        tagline, 
                        logo_url,
                        user_id
                    )
                `,
                )
                .eq("status", "approved")
                .order("created_at", { ascending: false });


            if (pitchesError) {
                console.error("Error fetching pitches:", pitchesError);
                setApprovedPitches([]);
                return;
            }

            if (pitchesData && pitchesData.length > 0) {
                const userIds = [...new Set(pitchesData.map((p) => p.user_id))];
                const { data: profilesData, error: profilesError } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", userIds);

                if (profilesError) {
                    console.error("Error fetching profiles:", profilesError);
                } else {
                    // Combine the data
                    const profilesMap = {};
                    profilesData?.forEach((profile) => {
                        profilesMap[profile.id] = profile;
                    });

                    const combinedData = pitchesData.map((pitch) => ({
                        ...pitch,
                        profiles: profilesMap[pitch.user_id],
                    }));
                    setApprovedPitches(combinedData);
                }
            } else {
                setApprovedPitches([]);
            }
        } catch (err) {
            console.error("Error fetching approved pitches:", err);
            setApprovedPitches([]);
        } finally {
            setLoadingApprovedPitches(false);
        }
    };

    useEffect(() => {
        fetchApprovedPitches();
    }, []);

    async function uploadPitchFile(file, userId, projectId) {
        const ext = file.name.split(".").pop();
        const filePath = `${userId}/${projectId}/${Date.now()}-pitch.${ext}`;
        const { error } = await supabase.storage
            .from("pitch-videos")
            .upload(filePath, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage
            .from("pitch-videos")
            .getPublicUrl(filePath);
        return urlData.publicUrl;
    }

    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");
        if (!user) {
            setError("You must be logged in.");
            setSubmitting(false);
            return;
        }
        if (!selectedProject) {
            setError("Please select a project.");
            setSubmitting(false);
            return;
        }

        // Check if user already has a pitch for this project
        const { data: existingPitch, error: checkError } = await supabase
            .from("pitch_submissions")
            .select("id, status")
            .eq("user_id", user.id)
            .eq("project_id", selectedProject)
            .maybeSingle();

        if (checkError) {
            setError("Error checking existing pitches.");
            setSubmitting(false);
            return;
        }

        if (existingPitch) {
            if (existingPitch.status === "pending") {
                setError(
                    "You already have a pending pitch for this project. Please wait for approval or rejection.",
                );
            } else if (existingPitch.status === "approved") {
                setError(
                    "You already have an approved pitch for this project. You can only have one pitch per project.",
                );
            } else if (existingPitch.status === "rejected") {
                // Allow resubmission for rejected pitches
                // Delete the old rejected pitch first
                await supabase
                    .from("pitch_submissions")
                    .delete()
                    .eq("id", existingPitch.id);
            }
        }

        let finalVideoUrl = videoUrl;
        let finalVideoType = videoType;
        try {
            if (videoType === "file") {
                if (!videoFile) throw new Error("No file selected");
                if (videoFile.size > 50 * 1024 * 1024)
                    throw new Error("File must be under 50MB");
                finalVideoUrl = await uploadPitchFile(
                    videoFile,
                    user.id,
                    selectedProject,
                );
                finalVideoType = "file";
            } else {
                if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
                    finalVideoType = "youtube";
                } else if (videoUrl.includes("loom.com")) {
                    finalVideoType = "loom";
                } else {
                    throw new Error("Please enter a valid YouTube or Loom link.");
                }
            }
            const { error: insertError } = await supabase
                .from("pitch_submissions")
                .insert([
                    {
                        user_id: user.id,
                        project_id: selectedProject,
                        video_url: finalVideoUrl,
                        video_type: finalVideoType,
                        title,
                        description,
                        status: "pending",
                    },
                ]);
            if (insertError) throw insertError;

            // Show success message and redirect
            setSnackbar({
                open: true,
                message: "Pitch submitted successfully! Please wait for team approval.",
                severity: "success",
            });
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            setError("Error submitting pitch: " + err.message);
            console.error("Pitch submission error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow text-center">
                <h2 className="text-2xl font-bold mb-4">Upload a Pitch Video</h2>
                <p className="mb-4">You must be logged in to upload a pitch.</p>
                <a
                    href="/UserRegister"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition"
                >
                    Login / Sign Up
                </a>
            </div>
        );
    }
    if (projects.length === 0) {
        return (
            <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow text-center">
                <h2 className="text-2xl font-bold mb-4">Upload a Pitch Video</h2>
                <p className="mb-4">
                    You must launch a project before uploading a pitch.
                </p>
                <a
                    href="/register"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition"
                >
                    Launch a Project
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        🎬 Pitch Your Startup
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Share your vision with the world. Upload your pitch video and get feedback from our community.
                    </p>
                </div>

                {/* Approved Pitches Gallery */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white opacity-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <span className="text-2xl">🎬</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            Approved Pitches
                                        </h2>
                                        <p className="text-emerald-100 text-sm">
                                            Watch inspiring pitches from other founders
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="bg-white text-emerald-600 hover:bg-gray-50 font-bold px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl border-2 border-white/50 hover:border-white"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Upload Pitch
                                </button>
                            </div>
                        </div>
                    </div>

                    {loadingApprovedPitches ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading approved pitches...</p>
                        </div>
                    ) : approvedPitches.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No approved pitches yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {approvedPitches.map((pitch) => (
                                <div
                                    key={pitch.id}
                                    className="bg-gray-50 rounded-lg overflow-hidden"
                                >
                                    <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            {pitch.projects?.logo_url && (
                                                <img
                                                    src={pitch.projects.logo_url}
                                                    alt="Project logo"
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-gray-800">
                                                    {pitch.title || "Untitled Pitch"}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    by {pitch.profiles?.full_name || "Anonymous"}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-700 mb-3">
                                            <strong>Project:</strong> {pitch.projects?.name}
                                        </p>


                                        {pitch.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {pitch.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {new Date(pitch.created_at).toLocaleDateString()}
                                            </span>

                                            {pitch.video_type === "file" ? (
                                                <ApprovedPitchVideoPlayer filePath={pitch.video_url} />
                                            ) : (
                                                <a
                                                    href={pitch.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Watch
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-black opacity-10"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <span className="text-2xl">🚀</span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">
                                                Upload Your Pitch
                                            </h2>
                                            <p className="text-indigo-100 text-sm">
                                                Share your startup story with the world
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className="text-white hover:text-gray-200 transition-colors duration-200"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="mx-8 mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-red-800">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="mx-8 mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-green-800">{success}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="p-8">
                                <div className="space-y-6">
                                    {/* Project Selection */}
                                    <div className="group">
                                        <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <span className="text-indigo-600 text-sm">📋</span>
                                            </div>
                                            Select Your Project
                                        </label>
                                        <select
                                            value={selectedProject}
                                            onChange={(e) => setSelectedProject(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 text-gray-700 bg-white group-hover:border-indigo-300"
                                            required
                                        >
                                            <option value="">Choose a project to pitch...</option>
                                            {projects.length > 0 ? (
                                                projects.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>
                                                    No available projects for pitch upload
                                                </option>
                                            )}
                                        </select>
                                        {projects.length === 0 && (
                                            <p className="text-sm text-orange-600 mt-2">
                                                All your projects already have approved pitches. You can only have one approved pitch per project.
                                            </p>
                                        )}
                                    </div>

                                    {/* Video Upload Section */}
                                    <div className="group">
                                        <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <span className="text-purple-600 text-sm">🎥</span>
                                            </div>
                                            Pitch Video
                                        </label>

                                        {/* Video Type Toggle */}
                                        <div className="flex gap-3 mb-4 p-2 bg-gray-50 rounded-xl border border-gray-200">
                                            <button
                                                type="button"
                                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${videoType === "link"
                                                    ? "bg-white text-purple-600 shadow-lg border-2 border-purple-200"
                                                    : "text-gray-600 hover:text-gray-800 hover:bg-white"
                                                    }`}
                                                onClick={() => setVideoType("link")}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>🔗</span>
                                                    <span>YouTube/Loom Link</span>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${videoType === "file"
                                                    ? "bg-white text-purple-600 shadow-lg border-2 border-purple-200"
                                                    : "text-gray-600 hover:text-gray-800 hover:bg-white"
                                                    }`}
                                                onClick={() => setVideoType("file")}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>📁</span>
                                                    <span>Upload File</span>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Video Input */}
                                        {videoType === "link" ? (
                                            <div className="relative">
                                                <input
                                                    type="url"
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-gray-700 placeholder-gray-400"
                                                    placeholder="Paste your YouTube or Loom video link here..."
                                                    value={videoUrl}
                                                    onChange={(e) => setVideoUrl(e.target.value)}
                                                    required
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors duration-300">
                                                    <input
                                                        type="file"
                                                        accept="video/mp4,video/webm"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            setVideoFile(file);
                                                            if (file) {
                                                                setSelectedFileName(file.name);
                                                                setSelectedFileSize((file.size / 1024 / 1024).toFixed(2) + " MB");
                                                            }
                                                        }}
                                                        required
                                                    />
                                                    <div className="space-y-2">
                                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Click to upload video</p>
                                                            <p className="text-xs text-gray-500">MP4, WebM up to 100MB</p>
                                                        </div>
                                                    </div>

                                                    {/* File Preview */}
                                                    {selectedFileName && (
                                                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-green-800 truncate">
                                                                        {selectedFileName}
                                                                    </p>
                                                                    <p className="text-xs text-green-600">
                                                                        Size: {selectedFileSize} • Ready to upload
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setVideoFile(null);
                                                                        setSelectedFileName("");
                                                                        setSelectedFileSize("");
                                                                    }}
                                                                    className="text-green-600 hover:text-green-800"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {videoType === "link"
                                                ? "Supported platforms: YouTube, Loom"
                                                : "Maximum file size: 100MB. Supported formats: MP4, WebM"
                                            }
                                        </p>
                                    </div>

                                    {/* Title Input */}
                                    <div className="group">
                                        <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                                                <span className="text-pink-600 text-sm">✏️</span>
                                            </div>
                                            Pitch Title
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 text-gray-700 placeholder-gray-400 group-hover:border-pink-300"
                                            placeholder="Give your pitch a catchy title..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            maxLength={100}
                                            required
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-xs text-gray-500">
                                                {title.length}/100 characters
                                            </p>
                                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                                                    style={{ width: `${(title.length / 100) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description Input */}
                                    <div className="group">
                                        <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                <span className="text-green-600 text-sm">📝</span>
                                            </div>
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-gray-700 resize-none placeholder-gray-400 group-hover:border-green-300"
                                            rows="4"
                                            placeholder="Tell us more about your pitch..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            maxLength={300}
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-xs text-gray-500">
                                                {description.length}/300 characters
                                            </p>
                                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                                                    style={{ width: `${(description.length / 300) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                            <div className="relative z-10">
                                                {submitting ? (
                                                    <div className="flex items-center justify-center">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Submitting...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center">
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                                        </svg>
                                                        Submit Pitch
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Troubleshooting Section */}
                            <div className="px-8 pb-6">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <h4 className="font-semibold text-yellow-800">Troubleshooting Upload Issues</h4>
                                    </div>
                                    <div className="text-sm text-yellow-700 space-y-1">
                                        <p>• <strong>File too large?</strong> Try compressing your video or use YouTube/Loom</p>
                                        <p>• <strong>Wrong format?</strong> Convert to MP4, WebM, or MOV</p>
                                        <p>• <strong>Still having issues?</strong> Check browser console for detailed errors</p>
                                        <p>• <strong>Alternative:</strong> Upload to YouTube/Loom and share the link</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MUI Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: "100%" }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </div>
        </div>
    );
}

// Helper component for approved pitch video preview
function ApprovedPitchVideoPlayer({ filePath }) {
    const [signedUrl, setSignedUrl] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function getSignedUrl() {
            if (!filePath) return;

            try {
                // Check if filePath is already a full URL
                if (filePath.startsWith('http')) {
                    setSignedUrl(filePath);
                    return;
                }

                // Extract the file path from the full URL if needed
                let path = filePath;
                if (filePath.includes('/storage/v1/object/public/pitch-videos/')) {
                    path = filePath.split('/storage/v1/object/public/pitch-videos/')[1];
                }



                const { data, error } = await supabase.storage
                    .from("pitch-videos")
                    .createSignedUrl(path, 60 * 60);

                if (error) {
                    console.error("Error creating signed URL:", error);
                    // Fallback to public URL
                    setSignedUrl(filePath);
                } else {
                    console.log("Signed URL created:", data?.signedUrl);
                    setSignedUrl(data?.signedUrl || "");
                }
            } catch (error) {
                console.error("Error creating signed URL:", error);
                // Fallback to public URL
                setSignedUrl(filePath);
            }
        }
        getSignedUrl();
    }, [filePath]);

    if (error) {
        return (
            <div className="text-red-500 text-sm">
                Error loading video: {error}
            </div>
        );
    }

    if (!signedUrl) {
        return (
            <div className="flex items-center justify-center w-full h-32 bg-gray-100 rounded">
                <span className="text-sm text-gray-500">Loading...</span>
            </div>
        );
    }

    return (
        <div className="relative">
            {!isPlaying ? (
                <button
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                    <Play className="w-4 h-4" />
                    Watch
                </button>
            ) : (
                <video
                    src={signedUrl}
                    controls
                    className="w-full h-32 object-cover rounded"
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => {
                        console.error("Video error:", e);
                        setError("Failed to load video");
                    }}
                />
            )}
        </div>
    );
}
