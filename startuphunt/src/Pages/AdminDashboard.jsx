import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../supabaseClient";

import {
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";

import {
  Eye,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Package,
  Flag,
  Check,
  X,
  HelpCircle,
  DollarSign,
  Mail,
  Phone,
  Calendar,
  Bell,
  Send,
  Users,
  User,
} from "lucide-react";

import { Link } from "react-router-dom";
import SortByDateFilter from "../Components/SortByDateFilter";
import PitchUpload from "./PitchUpload";

function sortProjectsByDate(
  projects,
  dateField = "created_at",
  order = "newest",
) {
  return [...projects].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    return order === "newest" ? dateB - dateA : dateA - dateB;
  });
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [deletingProject, setDeletingProject] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const [userCount, setUserCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [sortOrder, setSortOrder] = useState("newest");
  const [pitches, setPitches] = useState([]);
  const [loadingPitches, setLoadingPitches] = useState(true);

  // New state for advertising interests
  const [advertisingInterests, setAdvertisingInterests] = useState([]);
  const [loadingAdvertisingInterests, setLoadingAdvertisingInterests] = useState(true);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [showInterestModal, setShowInterestModal] = useState(false);

  // New state for notifications
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [notificationModal, setNotificationModal] = useState({
    open: false,
    type: "single", // "single" or "all"
    selectedUserId: "",
    title: "",
    message: "",
    notificationType: "admin_notification"
  });

  const [rejectionModal, setRejectionModal] = useState({
    open: false,
    pitchId: null,
    reason: "",
  });

  const [deletePitchModal, setDeletePitchModal] = useState({
    open: false,
    pitchId: null,
    videoUrl: null,
    videoType: null,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: { user },

          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          setSnackbar({
            open: true,
            message: "Please sign in",
            severity: "error",
          });
          return navigate("/");
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError || profile?.role !== "admin") {
          setSnackbar({
            open: true,
            message: "Access Denied: Admins Only",
            severity: "error",
          });
          return navigate("/");
        } else {
          setIsAdmin(true);
          fetchProjects();
          fetchReports();
          fetchPitches();
          fetchAdvertisingInterests();
        }
      } catch (error) {
        console.error("Error in checkAccess:", error);

        setSnackbar({
          open: true,
          message: "Error checking access",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(
      () => {
        setLoading(false);
      },

      5000,
    );

    checkAccess();

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: users } = await supabase.from("profiles").select("*", {
        count: "exact",
        head: true,
      });

      const { count: projects } = await supabase.from("projects").select("*", {
        count: "exact",
        head: true,
      });

      const { count: comments } = await supabase.from("comments").select("*", {
        count: "exact",
        head: true,
      });

      const { count: reports } = await supabase.from("reports").select("*", {
        count: "exact",
        head: true,
      });
      setUserCount(users || 0);
      setProjectCount(projects || 0);
      setCommentCount(comments || 0);
      setReportCount(reports || 0);
    };

    fetchCounts();
  }, []);

  // New useEffect to fetch users when notifications tab is selected
  useEffect(() => {
    if (activeTab === "notifications") {
      fetchUsers();
    }
  }, [activeTab]);

  // New function to fetch advertising interests
  const fetchAdvertisingInterests = async () => {
    setLoadingAdvertisingInterests(true);
    try {
      const { data, error } = await supabase
        .from("advertising_interests")
        .select(`
          *,
          projects:project_id (id, name, tagline, website_url, slug),
          profiles:user_id (id, full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdvertisingInterests(data || []);
    } catch (error) {
      console.error("Error fetching advertising interests:", error);
    } finally {
      setLoadingAdvertisingInterests(false);
    }
  };

  // New function to fetch users for notifications
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, username")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch users",
        severity: "error",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // New function to send notifications
  const sendNotification = async () => {
    try {
      if (notificationModal.type === "single" && !notificationModal.selectedUserId) {
        setSnackbar({
          open: true,
          message: "Please select a user",
          severity: "error",
        });
        return;
      }

      if (!notificationModal.message || !notificationModal.title) {
        setSnackbar({
          open: true,
          message: "Please fill in all fields",
          severity: "error",
        });
        return;
      }

      let notificationsToSend = [];

      if (notificationModal.type === "single") {
        // Send to specific user
        notificationsToSend.push({
          user_id: notificationModal.selectedUserId,
          type: notificationModal.notificationType,
          title: notificationModal.title,
          message: notificationModal.message,
          read: false,
        });
      } else {
        // Send to all users
        const { data: allUsers, error: usersError } = await supabase
          .from("profiles")
          .select("id");

        if (usersError) throw usersError;

        notificationsToSend = allUsers.map(user => ({
          user_id: user.id,
          type: notificationModal.notificationType,
          title: notificationModal.title,
          message: notificationModal.message,
          read: false,
        }));
      }

      const { error } = await supabase
        .from("notifications")
        .insert(notificationsToSend);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: `Notification sent to ${notificationModal.type === "single" ? "selected user" : "all users"} successfully!`,
        severity: "success",
      });

      // Reset form
      setNotificationModal({
        open: false,
        type: "single",
        selectedUserId: "",
        title: "",
        message: "",
        notificationType: "admin_notification"
      });

    } catch (error) {
      console.error("Error sending notification:", error);
      setSnackbar({
        open: true,
        message: "Failed to send notification",
        severity: "error",
      });
    }
  };

  // Function to update interest status
  const updateInterestStatus = async (interestId, status, adminNotes = "") => {
    try {
      const { error } = await supabase
        .from("advertising_interests")
        .update({
          status: status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq("id", interestId);

      if (error) {
        throw error;
      }

      setSnackbar({
        open: true,
        message: "Interest status updated successfully",
        severity: "success",
      });

      fetchAdvertisingInterests();
    } catch (error) {
      console.error("Error updating interest status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update interest status",
        severity: "error",
      });
    }
  };

  // Function to view interest details
  const viewInterestDetails = (interest) => {
    setSelectedInterest(interest);
    setShowInterestModal(true);
  };

  const fetchProjects = async () => {
    try {
      // Fetching projects...

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } else {
        // Projects data loaded
        setProjects(data || []);
      }
    } catch (error) {
      console.error("Error in fetchProjects:", error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
      // Finished loading projects
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);

    try {
      // First, fetch reports with project and comment data
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select(
          ` *,
                projects:project_id (id,
                    name,
                    slug,
                    website_url),
                comments:comment_id (id,
                    content,
                    project_id,
                    projects (id,
                        name,
                        slug,
                        website_url)) `,
        )
        .order("created_at", {
          ascending: false,
        });

      if (reportsError) {
        console.error("Error fetching reports:", reportsError);
        setReports([]);
        return;
      }

      // Then, fetch user profiles for all unique user IDs
      if (reportsData && reportsData.length > 0) {
        const userIds = [...new Set(reportsData.map((r) => r.user_id))];

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        } else {
          // Combine the data
          const profilesMap = {};

          profilesData?.forEach((profile) => {
            profilesMap[profile.id] = profile;
          });

          const combinedData = reportsData.map((report) => ({
            ...report,
            profiles: profilesMap[report.user_id],
          }));

          setReports(combinedData);
        }
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("Error in fetchReports:", error);
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const deleteProject = async (projectId, mediaUrls = []) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project and all its associated data?",
      )
    )
      return;

    setDeletingProject(projectId);

    try {
      // 1. Delete likes for this project
      const { error: likesError } = await supabase
        .from("project_likes")
        .delete()
        .eq("project_id", projectId);

      if (likesError) {
        console.error("Error deleting likes:", likesError);
      }

      // 2. Delete media files from storage
      if (mediaUrls && mediaUrls.length > 0) {
        const filePaths = mediaUrls
          .map((url) => {
            const parts = url.split("/startup-media/");
            return parts[1] || "";
          })
          .filter(Boolean);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("startup-media")
            .remove(filePaths);

          if (storageError) {
            console.error("Error deleting media files:", storageError);
          }
        }
      }

      // 3. Delete the project
      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (projectError) {
        throw projectError;
      }

      setSnackbar({
        open: true,
        message: "Project and all associated data deleted successfully.",
        severity: "success",
      });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);

      setSnackbar({
        open: true,
        message: "Failed to delete project. Please try again.",
        severity: "error",
      });
    } finally {
      setDeletingProject(null);
    }
  };

  const updateReportStatus = async (reportId, status) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status: status,
          resolved_at: status !== "pending" ? new Date().toISOString() : null,
        })
        .eq("id", reportId);

      if (error) {
        console.error("Error updating report:", error);

        setSnackbar({
          open: true,
          message: "Failed to update report status",
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Report status updated successfully",
          severity: "success",
        });
        fetchReports();
      }
    } catch (error) {
      console.error("Error in updateReportStatus:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "ignored":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fetch pitches
  const fetchPitches = async () => {
    // Fetching pitches...
    setLoadingPitches(true);

    try {
      // First, fetch pitches with project data
      const { data: pitchesData, error: pitchesError } = await supabase
        .from("pitch_submissions")
        .select(
          ` *,
                projects:project_id (id,
                    name,
                    tagline,
                    logo_url,
                    user_id) `,
        )
        .order("created_at", {
          ascending: false,
        });

      if (pitchesError) {
        console.error("Error fetching pitches:", pitchesError);
        setPitches([]);
        return;
      }

      // Pitches data loaded

      // Then, fetch user profiles for all unique user IDs
      if (pitchesData && pitchesData.length > 0) {
        const userIds = [...new Set(pitchesData.map((p) => p.user_id))];

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
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

          // Combined data loaded
          setPitches(combinedData);
        }
      } else {
        setPitches([]);
      }
    } catch (err) {
      console.error("Exception in fetchPitches:", err);
      setPitches([]);
    } finally {
      setLoadingPitches(false);
    }
  };

  // Approve/Reject pitch
  const updatePitchStatus = async (pitchId, status, rejectionReason = "") => {
    try {
      // Update pitch status
      const updateData = {
        status,
      };

      if (rejectionReason) {
        updateData.admin_notes = rejectionReason;
      }

      const { error: updateError } = await supabase
        .from("pitch_submissions")
        .update(updateData)
        .eq("id", pitchId);

      if (updateError) throw updateError;

      // Get pitch details for notification
      const { data: pitchData } = await supabase
        .from("pitch_submissions")
        .select("user_id, title, projects(name)")
        .eq("id", pitchId)
        .single();

      if (pitchData) {
        // Create notification
        const notificationType =
          status === "approved" ? "pitch_approved" : "pitch_rejected";

        const notificationData = {
          user_id: pitchData.user_id,
          type: notificationType,
          title: pitchData.title || "Your pitch",
          project_name: pitchData.projects?.name,
        };

        if (rejectionReason) {
          notificationData.message = `Reason: $ {
                        rejectionReason
                    }

                    `;
        }

        const { error: notifError } = await supabase
          .from("notifications")
          .insert([notificationData]);

        if (notifError) {
          console.error("Error creating notification:", notifError);
        }
      }

      // Refresh pitches list
      fetchPitches();

      setSnackbar({
        open: true,
        message: `Pitch $ {
                        status
                    }

                    successfully`,
        severity: "success",
      });

      setRejectionModal({
        open: false,
        pitchId: null,
        reason: "",
      });
    } catch (error) {
      console.error("Error updating pitch status:", error);

      setSnackbar({
        open: true,
        message: "Error updating pitch status",
        severity: "error",
      });
    }
  };

  const handleReject = (pitchId) => {
    setRejectionModal({
      open: true,
      pitchId,
      reason: "",
    });
  };

  const handleRejectConfirm = () => {
    updatePitchStatus(
      rejectionModal.pitchId,
      "rejected",
      rejectionModal.reason,
    );
  };

  // Delete pitch function
  const deletePitch = async (pitchId, videoUrl, videoType) => {
    setDeletePitchModal({
      open: true,
      pitchId,
      videoUrl,
      videoType,
    });
  };

  const handleDeletePitchConfirm = async () => {
    const { pitchId, videoUrl, videoType } = deletePitchModal;

    try {
      // If it's a file upload, delete from storage
      if (
        videoType === "file" &&
        videoUrl &&
        videoUrl.includes("pitch-videos")
      ) {
        const filePath = videoUrl.split("/pitch-videos/")[1];

        if (filePath) {
          await supabase.storage.from("pitch-videos").remove([filePath]);
        }
      }

      // Delete the pitch record
      const { error } = await supabase
        .from("pitch_submissions")
        .delete()
        .eq("id", pitchId);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: "Pitch deleted successfully",
        severity: "success",
      });

      setDeletePitchModal({
        open: false,
        pitchId: null,
        videoUrl: null,
        videoType: null,
      });
      fetchPitches();
    } catch (error) {
      console.error("Error deleting pitch:", error);

      setSnackbar({
        open: true,
        message: "Failed to delete pitch",
        severity: "error",
      });

      setDeletePitchModal({
        open: false,
        pitchId: null,
        videoUrl: null,
        videoType: null,
      });
    }
  };

  const handleDeletePitchCancel = () => {
    setDeletePitchModal({
      open: false,
      pitchId: null,
      videoUrl: null,
      videoType: null,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">

        <div className="text-center">

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">

        <div className="text-center">

          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const sortedProjects = sortProjectsByDate(projects, "created_at", sortOrder);

  return (
    <div className="min-h-screen bg-white p-8">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage platform projects and user reports
          </p>
        </div>
        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">

            <span className="text-2xl font-bold text-blue-600">

              {userCount}
            </span>
            <span className="text-gray-700 mt-2">Users</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">

            <span className="text-2xl font-bold text-green-600">

              {projectCount}
            </span>
            <span className="text-gray-700 mt-2">Projects</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">

            <span className="text-2xl font-bold text-purple-600">

              {commentCount}
            </span>
            <span className="text-gray-700 mt-2">Comments</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">

            <span className="text-2xl font-bold text-red-600">

              {reportCount}
            </span>
            <span className="text-gray-700 mt-2">Reports</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">

            <span className="text-2xl font-bold text-orange-600">

              {pitches.length}
            </span>
            <span className="text-gray-700 mt-2">Pitches</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">

          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm $ {
                activeTab==='projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }

            `}
          >

            <div className="flex items-center gap-2">

              <Package className="w-4 h-4" /> Projects ( {projects.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm $ {
                activeTab==='reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }

            `}
          >

            <div className="flex items-center gap-2">

              <Flag className="w-4 h-4" /> Reports ( {reports.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("pitches")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm $ {
                activeTab==='pitches'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }

            `}
          >

            <div className="flex items-center gap-2">

              <Package className="w-4 h-4" /> Pitches ( {pitches.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("advertising")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm $ {
                activeTab==='advertising'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }

            `}
          >

            <div className="flex items-center gap-2">

              <DollarSign className="w-4 h-4" /> Advertising ( {advertisingInterests.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm $ {
                activeTab==='notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }

            `}
          >

            <div className="flex items-center gap-2">

              <Bell className="w-4 h-4" /> Notifications ( {pitches.length})
            </div>
          </button>
        </div>
        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">

              <h2 className="text-lg font-semibold text-gray-800">
                All Projects ( {projects.length})
              </h2>
              <SortByDateFilter
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>
            {loadingProjects ? (
              <div className="p-8 text-center">

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center text-gray-500">

                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No projects found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Website
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {project.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {project.tagline}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {project.user_id || "Anonymous"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={project.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            {project.website_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(project.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              to={`/launches/${project.slug}`}
                              className="text-blue-600 hover:text-blue-800"
                              title="View project"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() =>
                                deleteProject(project.id, project.media_urls)
                              }
                              className="text-red-600 hover:text-red-800"
                              title="Delete project"
                              disabled={deletingProject === project.id}
                            >
                              {deletingProject === project.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

            <div className="px-6 py-4 border-b border-gray-200">

              <h2 className="text-lg font-semibold text-gray-800">
                User Reports ( {reports.length})
              </h2>
            </div>
            {loadingReports ? (
              <div className="p-8 text-center">

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">

                <Flag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No reports found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comment (if reported)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reporter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {report.reason.replace("_", " ")}
                            </p>
                            {report.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {report.comment_id && report.comments?.content ? (
                            <div className="text-xs text-gray-700 italic max-w-xs truncate">
                              {report.comments.content}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {report.comment_id && report.comments?.projects ? (
                            <Link
                              to={`/launches/${report.comments.projects.slug}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {report.comments.projects.name}
                            </Link>
                          ) : report.projects ? (
                            <Link
                              to={`/launches/${report.projects.slug}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {report.projects.name}
                            </Link>
                          ) : (
                            <span className="text-gray-500">
                              Project deleted
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {report.profiles?.full_name || "Anonymous"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.profiles?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {/* View button for project or comment */}
                            {report.projects ? (
                              <Link
                                to={`/launches/${report.projects.slug}`}
                                className="text-blue-600 hover:text-blue-800"
                                title="View reported project"
                                target="_blank"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            ) : report.comment_id ? ( // If it's a comment report, try to link to the project and scroll to comment
                              report.project_id && report.projects ? (
                                <Link
                                  to={`/launches/${report.projects.slug}?comment=${report.comment_id}`}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View reported comment"
                                  target="_blank"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              ) : (
                                <span className="text-gray-400">
                                  No project
                                </span>
                              )
                            ) : null}
                            {report.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    updateReportStatus(report.id, "resolved")
                                  }
                                  className="text-green-600 hover:text-green-800"
                                  title="Mark as resolved"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    updateReportStatus(report.id, "ignored")
                                  }
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Ignore report"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Pitches Tab */}
        {activeTab === "pitches" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loadingPitches ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading pitches...</p>
              </div>
            ) : pitches.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No pitch submissions found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Tagline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Logo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Founder
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Video
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">

                    {pitches.map((pitch) => (
                      <tr key={pitch.id} className="hover:bg-gray-50">

                        <td className="px-6 py-4">

                          <div>

                            <p className="text-sm font-medium text-gray-900">

                              {pitch.projects?.name}
                            </p>
                            <p className="text-xs text-gray-500">

                              {pitch.projects?.tagline}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">

                          <div className="text-sm text-gray-900">

                            {pitch.projects?.tagline}
                          </div>
                        </td>
                        <td className="px-6 py-4">

                          {pitch.projects?.logo_url && (
                            <img
                              src={pitch.projects.logo_url}
                              alt="Logo"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">

                          <div className="text-sm text-gray-900">

                            {pitch.profiles?.full_name}
                          </div>
                          <div className="text-xs text-gray-500">

                            {pitch.profiles?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">

                          {pitch.video_type === "file" ? (
                            <PitchVideoPlayer filePath={pitch.video_url} />
                          ) : pitch.video_type === "youtube" ? (
                            <a
                              href={pitch.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              YouTube
                            </a>
                          ) : pitch.video_type === "loom" ? (
                            <a
                              href={pitch.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              Loom
                            </a>
                          ) : null}
                        </td>
                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full $ {
                                            getStatusColor(pitch.status)
                                        }

                                        `}
                          >

                            {pitch.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">

                          <div className="flex gap-2">

                            {pitch.status === "pending" && (
                              <>

                                <button
                                  onClick={() =>
                                    updatePitchStatus(pitch.id, "approved")
                                  }
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve pitch"
                                >

                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(pitch.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject pitch"
                                >

                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() =>
                                deletePitch(
                                  pitch.id,
                                  pitch.video_url,
                                  pitch.video_type,
                                )
                              }
                              className="text-red-600 hover:text-red-800"
                              title="Delete pitch"
                            >

                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Advertising Interests Tab */}
        {activeTab === "advertising" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Advertising Interests ({advertisingInterests.length})
              </h2>
            </div>
            {loadingAdvertisingInterests ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading advertising interests...</p>
              </div>
            ) : advertisingInterests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No advertising interests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {advertisingInterests.map((interest) => (
                      <tr key={interest.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {interest.projects?.name || "Project Deleted"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {interest.projects?.tagline || "No tagline"}
                            </p>
                            {interest.projects?.website_url && (
                              <a
                                href={interest.projects.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                              >
                                {interest.projects.website_url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {interest.profiles?.full_name || "Anonymous"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {interest.profiles?.email || interest.user_email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {interest.plan_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {interest.plan_price}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center gap-1 mb-1">
                              <Mail className="w-3 h-3 text-gray-500" />
                              {interest.user_email}
                            </div>
                            {interest.user_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-500" />
                                {interest.user_phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${interest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              interest.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                                interest.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  interest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {interest.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {new Date(interest.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewInterestDetails(interest)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {interest.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateInterestStatus(interest.id, 'contacted')}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Mark as contacted"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateInterestStatus(interest.id, 'approved')}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateInterestStatus(interest.id, 'rejected')}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Send Notifications
              </h2>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setNotificationModal(prev => ({ ...prev, open: true }))}
                startIcon={<Bell className="w-4 h-4" />}
              >
                Send New Notification
              </Button>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Admin Notification System
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Send notifications to specific users or broadcast messages to all users on the platform.
                </p>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => setNotificationModal(prev => ({ ...prev, open: true }))}
                  startIcon={<Send className="w-4 h-4" />}
                >
                  Send Notification
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Interest Details Modal */}
      <Dialog
        open={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">
                Advertising Interest Details
              </h3>
              <p className="text-sm text-blue-600 mt-1">
                Review the complete submission details
              </p>
            </div>
          </div>
        </DialogTitle>
        <DialogContent className="pt-6">
          {selectedInterest && (
            <div className="space-y-6">
              {/* Project Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Project Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Project Name:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.projects?.name || "Project Deleted"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tagline:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.projects?.tagline || "No tagline"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Website:</p>
                    <p className="font-medium text-gray-800">
                      {selectedInterest.projects?.website_url ? (
                        <a
                          href={selectedInterest.projects.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedInterest.projects.website_url}
                        </a>
                      ) : (
                        "No website"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Project ID:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.project_id}</p>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">User Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.user_phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User ID:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.user_id}</p>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Plan Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Selected Plan:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.plan_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plan ID:</p>
                    <p className="font-medium text-gray-800">{selectedInterest.plan_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status:</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedInterest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedInterest.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                          selectedInterest.status === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedInterest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {selectedInterest.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {selectedInterest.additional_info && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Additional Information</h4>
                  <p className="text-gray-700">{selectedInterest.additional_info}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Timestamps</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Submitted:</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedInterest.created_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedInterest.updated_at && (
                    <div>
                      <p className="text-sm text-gray-600">Last Updated:</p>
                      <p className="font-medium text-gray-800">
                        {new Date(selectedInterest.updated_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Admin Notes</h4>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={selectedInterest.admin_notes || ""}
                  onChange={(e) => {
                    setSelectedInterest(prev => ({
                      ...prev,
                      admin_notes: e.target.value
                    }));
                  }}
                  placeholder="Add admin notes..."
                  variant="outlined"
                />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-6 pt-0">
          <Button
            onClick={() => setShowInterestModal(false)}
            variant="outlined"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Close
          </Button>
          {selectedInterest && (
            <Button
              onClick={() => {
                updateInterestStatus(selectedInterest.id, selectedInterest.status, selectedInterest.admin_notes);
                setShowInterestModal(false);
              }}
              variant="contained"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Notes
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* Rejection Modal */}
      <Dialog
        open={rejectionModal.open}
        onClose={() =>
          setRejectionModal({
            open: false,
            pitchId: null,
            reason: "",
          })
        }
        maxWidth="sm"
        fullWidth
      >

        <DialogTitle className="bg-red-50 border-b border-red-200">

          <div className="flex items-center gap-3">

            <div className="p-2 bg-red-100 rounded-full">

              <X className="w-6 h-6 text-red-600" />
            </div>
            <div>

              <h3 className="text-lg font-semibold text-red-800">
                Reject Pitch
              </h3>
              <p className="text-sm text-red-600 mt-1">
                Provide a reason for rejection
              </p>
            </div>
          </div>
        </DialogTitle>
        <DialogContent className="pt-6">

          <div className="space-y-4">

            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">

              <div className="p-2 bg-yellow-100 rounded-full">

                <HelpCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>

                <p className="font-medium text-yellow-800">
                  Rejection Reason (Optional)
                </p>
                <p className="text-sm text-yellow-700 mt-1">

                  Providing a reason helps the founder understand why their
                  pitch was rejected.
                </p>
              </div>
            </div>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={rejectionModal.reason}
              onChange={(e) =>
                setRejectionModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Enter rejection reason..."
              variant="outlined"
            />
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">

          <Button
            onClick={() =>
              setRejectionModal({
                open: false,
                pitchId: null,
                reason: "",
              })
            }
            variant="outlined"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >

            Cancel
          </Button>
          <Button
            onClick={handleRejectConfirm}
            variant="contained"
            className="bg-red-600 hover:bg-red-700 text-white"
            startIcon={<X className="w-4 h-4" />}
          >

            Reject Pitch
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Pitch Confirmation Modal */}
      <Dialog
        open={deletePitchModal.open}
        onClose={handleDeletePitchCancel}
        maxWidth="sm"
        fullWidth
      >

        <DialogTitle className="bg-red-50 border-b border-red-200">

          <div className="flex items-center gap-3">

            <div className="p-2 bg-red-100 rounded-full">

              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>

              <h3 className="text-lg font-semibold text-red-800">
                Delete Pitch
              </h3>
              <p className="text-sm text-red-600 mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
        </DialogTitle>
        <DialogContent className="pt-6">

          <div className="space-y-4">

            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">

              <div className="p-2 bg-yellow-100 rounded-full">

                <HelpCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>

                <p className="font-medium text-yellow-800">
                  Are you absolutely sure?
                </p>
                <p className="text-sm text-yellow-700 mt-1">

                  This will permanently delete the pitch video and all
                  associated data. This action cannot be reversed.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">

              <h4 className="font-medium text-gray-800 mb-2">
                What will be deleted:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">

                <li className="flex items-center gap-2">

                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  Pitch video file
                </li>
                <li className="flex items-center gap-2">

                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  Pitch submission record
                </li>
                <li className="flex items-center gap-2">

                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  All associated metadata
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">

          <Button
            onClick={handleDeletePitchCancel}
            variant="outlined"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >

            Cancel
          </Button>
          <Button
            onClick={handleDeletePitchConfirm}
            variant="contained"
            className="bg-red-600 hover:bg-red-700 text-white"
            startIcon={<Trash2 className="w-4 h-4" />}
          >

            Delete Pitch
          </Button>
        </DialogActions>
      </Dialog>
      {/* Notification Modal */}
      <Dialog
        open={notificationModal.open}
        onClose={() => setNotificationModal(prev => ({ ...prev, open: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Send Notification
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <FormControl fullWidth variant="outlined">
              <InputLabel id="notification-type-label">Notification Type</InputLabel>
              <Select
                labelId="notification-type-label"
                value={notificationModal.type}
                onChange={(e) =>
                  setNotificationModal((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
                label="Notification Type"
              >
                <MenuItem value="single">Send to a Specific User</MenuItem>
                <MenuItem value="all">Send to All Users</MenuItem>
              </Select>
            </FormControl>

            {notificationModal.type === "single" && (
              <FormControl fullWidth variant="outlined">
                <InputLabel id="user-select-label">Select User</InputLabel>
                <Select
                  labelId="user-select-label"
                  value={notificationModal.selectedUserId}
                  onChange={(e) =>
                    setNotificationModal((prev) => ({
                      ...prev,
                      selectedUserId: e.target.value,
                    }))
                  }
                  label="Select User"
                  disabled={loadingUsers}
                >
                  {loadingUsers ? (
                    <MenuItem value="">
                      <Chip label="Loading Users..." />
                    </MenuItem>
                  ) : (
                    <>
                      <MenuItem value="">
                        <Chip label="Select a user" />
                      </MenuItem>
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          <Chip label={user.full_name || user.username || user.email} />
                        </MenuItem>
                      ))}
                    </>
                  )}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Notification Title"
              value={notificationModal.title}
              onChange={(e) =>
                setNotificationModal((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              variant="outlined"
              placeholder="Enter notification title..."
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notification Message"
              value={notificationModal.message}
              onChange={(e) =>
                setNotificationModal((prev) => ({
                  ...prev,
                  message: e.target.value,
                }))
              }
              variant="outlined"
              placeholder="Enter notification message..."
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel id="notification-category-label">Category</InputLabel>
              <Select
                labelId="notification-category-label"
                value={notificationModal.notificationType}
                onChange={(e) =>
                  setNotificationModal((prev) => ({
                    ...prev,
                    notificationType: e.target.value,
                  }))
                }
                label="Category"
              >
                <MenuItem value="admin_notification">Admin Notification</MenuItem>
                <MenuItem value="pitch_approved">Pitch Approved</MenuItem>
                <MenuItem value="pitch_rejected">Pitch Rejected</MenuItem>
                <MenuItem value="project_approved">Project Approved</MenuItem>
                <MenuItem value="project_rejected">Project Rejected</MenuItem>
                <MenuItem value="announcement">Announcement</MenuItem>
                <MenuItem value="maintenance">Maintenance Notice</MenuItem>
                <MenuItem value="update">Platform Update</MenuItem>
              </Select>
            </FormControl>

            {notificationModal.type === "all" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Broadcast Notice</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  This notification will be sent to all users on the platform. Use this feature carefully.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationModal(prev => ({ ...prev, open: false }))}>
            Cancel
          </Button>
          <Button
            onClick={sendNotification}
            variant="contained"
            color="primary"
            disabled={loadingUsers || !notificationModal.message || !notificationModal.title || (notificationModal.type === "single" && !notificationModal.selectedUserId)}
            startIcon={<Send className="w-4 h-4" />}
          >
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
      >

        <Alert
          onClose={() =>
            setSnackbar({
              ...snackbar,
              open: false,
            })
          }
          severity={snackbar.severity}
          sx={{
            width: "100%",
          }}
        >

          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminDashboard;

// Helper component for video preview
function PitchVideoPlayer({ filePath }) {
  const [signedUrl, setSignedUrl] = useState("");
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

        console.log("Creating signed URL for path:", path);

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
      <div className="flex items-center justify-center w-48 h-32 bg-gray-100 rounded">
        <span className="text-sm text-gray-500">Loading video...</span>
      </div>
    );
  }

  return (
    <video
      src={signedUrl}
      controls
      width={200}
      height={150}
      className="rounded border"
      onError={(e) => {
        console.error("Video error:", e);
        setError("Failed to load video");
      }}
    />
  );
}
