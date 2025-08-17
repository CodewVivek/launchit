import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  ExternalLink,
  Calendar,
  Tag,
  MessageCircle,
  Rss,
  Star,
  Edit3,
  Trash2,
  HelpCircle,
  Menu,
  X,
  Briefcase,
  Link as LinkIcon,
  Twitter,
  Linkedin,
  Youtube,
  Eye,
  Clock,
  Check,
  X as XIcon,
  UserPlus,
  UserCheck,
  Rocket,
  MessageSquare,
  BookmarkCheck,
  Bookmark,
} from "lucide-react";
import Like from "../Components/Like";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import SortByDateFilter from "../Components/SortByDateFilter";
import toast from "react-hot-toast";

// Helper function to sort projects
function sortProjectsByDate(projects, dateField = "created_at", order = "newest") {
  return [...projects].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    return order === "newest" ? dateB - dateA : dateA - dateB;
  });
}

// Helper component for video preview
function PitchVideoPlayer({ filePath }) {
  const [signedUrl, setSignedUrl] = useState("");
  useEffect(() => {
    async function getSignedUrl() {
      if (!filePath) return;
      try {
        const { data, error } = await supabase.storage
          .from("pitch-videos")
          .createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour

        if (error) {
          console.error("Error creating signed URL:", error);
          // Fallback to public URL if signed URL creation fails
          const { data: publicUrlData } = supabase.storage
            .from("pitch-videos")
            .getPublicUrl(filePath);
          setSignedUrl(publicUrlData.publicUrl);
        } else {
          setSignedUrl(data?.signedUrl || "");
        }
      } catch (error) {
        console.error("Error creating signed URL:", error);
        const { data: publicUrlData } = supabase.storage
          .from("pitch-videos")
          .getPublicUrl(filePath);
        setSignedUrl(publicUrlData.publicUrl);
      }
    }
    getSignedUrl();
  }, [filePath]);

  if (!signedUrl) return <span>Loading video...</span>;
  return (
    <video src={signedUrl} controls className="w-48 rounded-lg" />
  );
}

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [comments, setComments] = useState([]);
  const [userPitches, setUserPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // States for modals and notifications
  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteProject, setDeleteProject] = useState(null);
  const [deletePitchModal, setDeletePitchModal] = useState({ open: false, pitchId: null, status: null });
  const [editError, setEditError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // States for follow functionality
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Function to fetch all projects for the current profile
  const fetchUserProjects = async (profileId) => {
    if (!profileId) return;
    try {
      const { data: userProjects, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", profileId);
      if (error) {
        console.error("Error fetching user projects:", error);
        setProjects([]);
      } else {
        setProjects(userProjects || []);
      }
    } catch (err) {
      console.error("Exception in fetchUserProjects:", err);
      setProjects([]);
    }
  };

  // Function to fetch all pitches for the current profile
  const fetchUserPitches = async (profileId) => {
    if (!profileId) {
      setLoadingPitches(false);
      return;
    }
    setLoadingPitches(true);
    try {
      const { data, error } = await supabase
        .from("pitch_submissions")
        .select(`*, projects:project_id ( id, name, tagline, logo_url )`)
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });
      if (!error) {
        setUserPitches(data || []);
      } else {
        console.error("Error fetching user pitches:", error);
        setUserPitches([]);
      }
    } catch (err) {
      console.error("Exception in fetchUserPitches:", err);
      setUserPitches([]);
    }
    setLoadingPitches(false);
  };

  // Main useEffect to fetch all profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username || username.includes("${") || username.includes("profile.username")) {
        navigate("/");
        return;
      }
      const decodedUsername = decodeURIComponent(username);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", decodedUsername)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError.message);
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(profileData);

        const { data: { user: loggedInUser } } = await supabase.auth.getUser();
        setCurrentUser(loggedInUser);

        const isProfileOwner = loggedInUser && loggedInUser.id === profileData.id;
        setIsOwner(isProfileOwner);

        let userProjects = [];
        if (isProfileOwner) {
          const { data: allProjects } = await supabase.from("projects").select("*").eq("user_id", profileData.id);
          userProjects = allProjects || [];
          await fetchUserPitches(profileData.id);
        } else {
          const { data: nonDraftProjects } = await supabase.from("projects").select("*").eq("user_id", profileData.id).neq("status", "draft");
          userProjects = nonDraftProjects || [];
        }
        setProjects(userProjects);

        if (userProjects && userProjects.length > 0) {
          const projectIds = userProjects.map((p) => p.id);
          const { data: userComments, error: commentsError } = await supabase.from("comments").select("*, projects(name, slug)").in("project_id", projectIds).eq("user_id", profileData.id);
          if (!commentsError) {
            setComments(userComments);
          } else {
            setComments([]);
          }
        } else {
          setComments([]);
        }

        if (loggedInUser && !isProfileOwner) {
          const { data: followData } = await supabase.from('follows').select('id').eq('follower_id', loggedInUser.id).eq('following_id', profileData.id).single();
          setIsFollowing(!!followData);
        }
      } catch (err) {
        console.error("Exception fetching profile data:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [username, navigate, isOwner]);

  // Edit handlers
  const handleEditClick = (project) => { setEditProject(project); setEditForm({ ...project }); };
  const handleEditClose = () => { setEditProject(null); setEditError(""); };
  const handleEditChange = (e) => { setEditForm({ ...editForm, [e.target.name]: e.target.value }); };
  const handleEditSave = async () => {
    try {
      const { error } = await supabase.from("projects").update({
        name: editForm.name,
        tagline: editForm.tagline,
        description: editForm.description,
        website_url: editForm.website_url,
        category_type: editForm.category_type,
        updated_at: new Date().toISOString(),
      }).eq("id", editProject.id);
      if (error) throw error;
      setEditProject(null);
      setSnackbar({ open: true, message: "Project updated successfully!", severity: "success" });
      setTimeout(() => fetchUserProjects(profile.id), 500);
    } catch (err) {
      setEditError(err.message || "Failed to update project.");
    }
  };

  // Delete handlers
  const handleDeleteClick = (project) => setDeleteProject(project);
  const handleDeleteCancel = () => setDeleteProject(null);
  const handleDeleteConfirm = async () => {
    try {
      await supabase.from("project_likes").delete().eq("project_id", deleteProject.id);
      await supabase.from("comments").delete().eq("project_id", deleteProject.id);
      const { error } = await supabase.from("projects").delete().eq("id", deleteProject.id);
      if (error) throw error;
      setDeleteProject(null);
      setSnackbar({ open: true, message: "Project deleted successfully!", severity: "success" });
      setTimeout(() => fetchUserProjects(profile.id), 500);
    } catch (err) {
      console.error("Error in handleDeleteConfirm:", err);
      setEditError(err.message || "Failed to delete project.");
    }
  };

  // Delete pitch handlers
  const deletePitch = (pitchId, status) => {
    setDeletePitchModal({ open: true, pitchId, status });
  };
  const handleDeletePitchConfirm = async () => {
    const { pitchId, status } = deletePitchModal;
    try {
      const { data: pitchData, error: fetchError } = await supabase.from("pitch_submissions").select("video_url, video_type").eq("id", pitchId).single();
      if (fetchError) throw fetchError;
      if (pitchData?.video_type === "file" && pitchData?.video_url && pitchData.video_url.includes("pitch-videos")) {
        const filePath = pitchData.video_url.split("/pitch-videos/")[1];
        if (filePath) await supabase.storage.from("pitch-videos").remove([filePath]);
      }
      const { error: deleteError } = await supabase.from("pitch_submissions").delete().eq("id", pitchId);
      if (deleteError) throw deleteError;
      setTimeout(() => fetchUserPitches(profile.id), 500);
      setSnackbar({ open: true, message: "Pitch deleted successfully", severity: "success" });
      setDeletePitchModal({ open: false, pitchId: null, status: null });
    } catch (error) {
      console.error("Error deleting pitch:", error);
      setSnackbar({ open: true, message: "Failed to delete pitch: " + error.message, severity: "error" });
      setDeletePitchModal({ open: false, pitchId: null, status: null });
    }
  };
  const handleDeletePitchCancel = () => { setDeletePitchModal({ open: false, pitchId: null, status: null }); };

  // Delete comment handler
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;

      // Refresh comments
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success("Comment deleted successfully!");
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment. Please try again.");
    }
  };

  // Status icons and colors
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "approved": return <Check className="w-4 h-4 text-green-500" />;
      case "rejected": return <XIcon className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Time ago helper
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Follow functionality
  const handleFollow = async () => {
    if (!currentUser) { toast.error("Please login to follow users"); return; }
    if (!profile || currentUser.id === profile.id) { toast.error("Invalid action"); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id);
        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${profile.full_name || profile.username}`);
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profile.id });
        if (error) throw error;
        setIsFollowing(true);
        toast.success(`Following ${profile.full_name || profile.username}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(isFollowing ? 'Failed to unfollow' : 'Failed to follow');
    } finally {
      setFollowLoading(false);
    }
  };

  // Check if a draft has at least one required field filled
  const isDraftStarted = (project) => !!(project.name || project.tagline || project.description || project.website_url || project.category_type);

  // Filter and sort projects based on state
  const filteredProjects = projects.filter((project) => {
    if (projectFilter === "all") return true;
    if (projectFilter === "draft") return project.status === "draft" && isDraftStarted(project);
    if (projectFilter === "launched") return project.status !== "draft";
    return true;
  });
  const sortedProjects = sortProjectsByDate(filteredProjects, "created_at", sortOrder);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">User profile not found.</p>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans transition-colors duration-300 pt-16">
      {/* Main Content */}
      <main className="w-full flex-1 p-4 sm:p-6 md:p-8">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8 transition-colors duration-300">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src={profile.avatar_url || "https://api.dicebear.com/6.x/initials/svg?seed=" + profile.username}
              alt="Profile"
              className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white object-cover shadow-md"
              loading="lazy"
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {profile.full_name || profile.username || "Unnamed User"}
              </h1>
              <p className="text-gray-500 text-sm mb-3">
                {profile.email || "No email provided"}
              </p>
              <p className="text-gray-700 mb-4 max-w-xl mx-auto md:mx-0">
                {profile.bio || "This user has not written a bio yet"}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500">
                {profile.twitter && (<a href={profile.twitter} target="_blank" rel="noreferrer" className="hover:text-blue-500 flex items-center gap-1.5 transition-colors"> <Twitter className="w-4 h-4" /><span>Twitter</span></a>)}
                {profile.linkedin && (<a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-700 flex items-center gap-1.5 transition-colors"> <Linkedin className="w-4 h-4" /><span>LinkedIn</span></a>)}
                {profile.youtube && (<a href={profile.youtube} target="_blank" rel="noreferrer" className="hover:text-red-600 flex items-center gap-1.5 transition-colors"> <Youtube className="w-4 h-4" /><span>YouTube</span></a>)}
                {profile.portfolio && (<a href={profile.portfolio} target="_blank" rel="noreferrer" className="hover:text-gray-800 flex items-center gap-1.5 transition-colors"> <Briefcase className="w-4 h-4" /><span>Portfolio</span></a>)}
              </div>
            </div>
            {currentUser && currentUser.id !== profile.id && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`mt-4 md:mt-0 md:ml-auto px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md self-center md:self-start ${isFollowing ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {followLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                ) : isFollowing ? (
                  <div className="flex items-center gap-2"> <UserCheck className="w-4 h-4" />Following </div>
                ) : (
                  <div className="flex items-center gap-2"> <UserPlus className="w-4 h-4" />Follow </div>
                )}
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => navigate("/settings")}
                className="mt-4 md:mt-0 md:ml-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md self-center md:self-start"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="flex space-x-8 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === "projects" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab("pitches")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === "pitches" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Pitches
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${activeTab === "comments" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Comments
          </button>
        </div>
        {activeTab === "projects" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap gap-2 text-sm font-medium">
                <button
                  onClick={() => setProjectFilter("all")}
                  className={`px-4 py-2 rounded-full transition-colors ${projectFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                  All ({projects.length})
                </button>
                {isOwner && (
                  <button
                    onClick={() => setProjectFilter("draft")}
                    className={`px-4 py-2 rounded-full transition-colors ${projectFilter === "draft" ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  >
                    Drafts ({projects.filter((p) => p.status === "draft").length})
                  </button>
                )}
                <button
                  onClick={() => setProjectFilter("launched")}
                  className={`px-4 py-2 rounded-full transition-colors ${projectFilter === "launched" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                  Launched ({projects.filter((p) => p.status !== "draft").length})
                </button>
              </div>
              <SortByDateFilter value={sortOrder} onChange={setSortOrder} />
            </div>

            {sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => navigate(`/launches/${project.slug}`)}
                  >
                    <div className="relative pt-[56.25%] bg-gray-100 rounded-t-xl overflow-hidden">
                      {project.thumbnail_url ? (
                        <img
                          src={project.thumbnail_url}
                          alt={`${project.name} thumbnail`}
                          className="absolute top-0 left-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-gray-400">Nt</div>
                      )}
                    </div>
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex items-start gap-4 mb-3">
                        {project.logo_url ? (
                          <img
                            src={project.logo_url}
                            alt="Logo"
                            className="w-12 h-12 object-contain rounded-lg border bg-white mt-1"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold border flex-shrink-0 mt-1">
                            <span>{project.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <h2 className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors">{project.name}</h2>
                          <p className="text-sm text-gray-600 line-clamp-2">{project.tagline}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-500 mt-auto mb-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="capitalize font-medium text-gray-700">{project.category_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            Launched on{" "}
                            {new Date(project.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <Like projectId={project.id} />
                        {isOwner && (
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/submit?edit=${project.id}`); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                <h4 className="text-lg font-semibold text-gray-800">No Projects Found</h4>
                <p className="text-gray-500 mt-1">There are no projects matching the selected filter.</p>
              </div>
            )}
          </>
        )}
        {activeTab === "pitches" && isOwner && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">My Pitches</h2>
            </div>
            {loadingPitches ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading pitches...</p>
              </div>
            ) : userPitches.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No pitches submitted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {userPitches.map((pitch) => (
                  <div key={pitch.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{pitch.title || "Untitled Pitch"}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pitch.status)}`}>
                            {getStatusIcon(pitch.status)}{pitch.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">Project: {pitch.projects?.name}</p>
                        {pitch.description && (<p className="text-gray-700 mb-3">{pitch.description}</p>)}
                        {pitch.admin_notes && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-red-800"><strong>Rejection Reason:</strong> {pitch.admin_notes}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Submitted: {new Date(pitch.created_at).toLocaleDateString()}</span>
                          <span>Type: {pitch.video_type}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {pitch.video_type === "file" ? (
                          <PitchVideoPlayer filePath={pitch.video_url} />
                        ) : (
                          <a href={pitch.video_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors" title="Watch on external site">
                            <Eye className="w-5 h-5" />
                          </a>
                        )}
                        <button onClick={() => deletePitch(pitch.id, pitch.status)} className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors" title="Delete pitch">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "comments" && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h3 className="text-xl font-bold text-gray-800">My Comments</h3>
              <MessageCircle className="w-5 h-5 text-gray-500" />
            </div>
            <div className="mt-6">
              {comments && comments.length > 0 ? (
                <ul className="space-y-4">
                  {comments.map((comment) => (
                    <li key={comment.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-start gap-3">
                        <img
                          src={profile.avatar_url || "https://api.dicebear.com/6.x/initials/svg?seed=" + profile.username}
                          alt="author avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{comment.content}</p>
                          <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                            <div>
                              <span>Commented on{" "}
                                <a href={`/launches/${comment.projects.slug}`} className="font-semibold text-blue-600 hover:underline">{comment.projects.name}</a>
                              </span>
                              <span className="mx-1">·</span>
                              <span>{getTimeAgo(comment.created_at)}</span>
                            </div>
                            {isOwner && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                                title="Delete comment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                  <h4 className="text-lg font-semibold text-gray-800">No Comments Yet</h4>
                  <p className="text-gray-500 mt-1">You haven't made any comments yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit {editForm.name}</DialogTitle>
        <DialogContent>
          <TextField label="Name" name="name" value={editForm.name || ""} onChange={handleEditChange} fullWidth margin="dense" disabled={editProject?.status !== "draft"} />
          <TextField label="Tagline" name="tagline" value={editForm.tagline || ""} onChange={handleEditChange} fullWidth margin="dense" />
          <TextField label="Website URL" name="website_url" value={editForm.website_url || ""} onChange={handleEditChange} fullWidth margin="dense" disabled={editProject?.status !== "draft"} />
          <TextField label="Description" name="description" value={editForm.description || ""} onChange={handleEditChange} fullWidth margin="dense" multiline rows={4} />
          {editError && (<Alert severity="error" className="mt-4">{editError}</Alert>)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} color="primary" variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation */}
      <Dialog open={!!deleteProject} onClose={handleDeleteCancel}>
        <DialogTitle>Delete "{deleteProject?.name}"?</DialogTitle>
        <DialogContent><p>Are you sure you want to delete this project? This action cannot be undone.</p></DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Pitch Confirmation Modal */}
      <Dialog open={deletePitchModal.open} onClose={handleDeletePitchCancel} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full"><Trash2 className="w-6 h-6 text-red-600" /></div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Delete Pitch</h3>
              <p className="text-sm text-red-600 mt-1">This action cannot be undone</p>
            </div>
          </div>
        </DialogTitle>
        <DialogContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-full"><HelpCircle className="w-5 h-5 text-yellow-600" /></div>
              <div>
                <p className="font-medium text-yellow-800">Are you absolutely sure?</p>
                <p className="text-sm text-yellow-700 mt-1">This will permanently delete your pitch video and all associated data. This action cannot be reversed.</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>Your pitch video file</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>Pitch submission record</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>All associated metadata</li>
              </ul>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">
          <Button onClick={handleDeletePitchCancel} variant="outlined" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
          <Button onClick={handleDeletePitchConfirm} variant="contained" className="bg-red-600 hover:bg-red-700 text-white" startIcon={<Trash2 className="w-4 h-4" />}>Delete Pitch</Button>
        </DialogActions>
      </Dialog>
      {/* MUI Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default UserProfile;