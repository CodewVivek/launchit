import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  X,
  User,
  Link as LinkIcon,
  Trash2,
  Camera,
  LogOut,
} from "lucide-react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    twitter: "",
    linkedin: "",
    portfolio: "",
    youtube: "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleDeleteAccount = async () => {
    try {
      if (!profile) return;
      // Simplified deletion logic
      await supabase.rpc("delete_user_account");
      await supabase.auth.signOut();
      setSnackbar({
        open: true,
        message: "Account and all data deleted successfully",
        severity: "success",
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete account",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          bio: profileData.bio || "",
          twitter: profileData.twitter || "",
          linkedin: profileData.linkedin || "",
          portfolio: profileData.portfolio || "",
          youtube: profileData.youtube || "",
        });
        setAvatarUrl(profileData.avatar_url || "");
      } else {
        console.error("Error fetching profile:", error);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    // Saving profile
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        bio: formData.bio,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
        portfolio: formData.portfolio,
        youtube: formData.youtube,
        avatar_url: avatarUrl, // Only if changed
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      // Supabase update error
      setSnackbar({
        open: true,
        message: "Failed to save changes",
        severity: "error",
      });
    } else {
      setSnackbar({
        open: true,
        message: "Profile updated successfully",
        severity: "success",
      });
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`;

    let { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      setSnackbar({
        open: true,
        message: "Failed to upload avatar",
        severity: "error",
      });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      setSnackbar({
        open: true,
        message: "Failed to update avatar URL",
        severity: "error",
      });
    } else {
      setAvatarUrl(publicUrl);
      setSnackbar({
        open: true,
        message: "Profile picture updated!",
        severity: "success",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Profile Information
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Update your personal details here.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <img
                    src={
                      avatarUrl ||
                      `https://api.dicebear.com/6.x/initials/svg?seed=${profile?.username}`
                    }
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-white shadow"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <Camera className="w-4 h-4" /> Change Photo
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 cursor-not-allowed text-gray-500"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    rows="4"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 transition-colors duration-300 rounded-b-md mt-6">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        );
      case "socials":
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Social Links
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Connect your other accounts.
              </p>
              <div className="space-y-4">
                {["twitter", "linkedin", "portfolio", "youtube"].map((social) => (
                  <div key={social}>
                    <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                      {social}
                    </label>
                    <input
                      type="url"
                      name={social}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder={`https://...`}
                      value={formData[social]}
                      onChange={handleFormChange}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 transition-colors duration-300 rounded-b-md mt-6">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        );
      case "danger":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-red-600 mb-1">
                Danger Zone
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Manage your account deletion here.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="font-bold text-red-800">
                  Delete Your Account
                </h3>
                <p className="text-sm text-red-700 mt-2 mb-4">
                  Once you delete your account, there is no going back. Please be
                  certain.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300">
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>

      <header className="bg-white shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Account Settings
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
            <nav className="space-y-1">
              <a
                onClick={() => setActiveTab("profile")}
                className={`cursor-pointer group rounded-md px-3 py-2 flex items-center text-sm font-medium ${activeTab === "profile" ? "bg-gray-100 text-blue-600" : "text-gray-900 hover:bg-gray-50"}`}
              >
                <User
                  className={`-ml-1 mr-3 h-6 w-6 ${activeTab === "profile" ? "text-blue-500" : "text-gray-400"}`}
                />
                <span className="truncate">Profile</span>
              </a>
              <a
                onClick={() => setActiveTab("socials")}
                className={`cursor-pointer group rounded-md px-3 py-2 flex items-center text-sm font-medium ${activeTab === "socials" ? "bg-gray-100 text-blue-600" : "text-gray-900 hover:bg-gray-50"}`}
              >
                <LinkIcon
                  className={`-ml-1 mr-3 h-6 w-6 ${activeTab === "socials" ? "text-blue-500" : "text-gray-400"}`}
                />
                <span className="truncate">Socials</span>
              </a>
              <a
                onClick={() => setActiveTab("danger")}
                className={`cursor-pointer group rounded-md px-3 py-2 flex items-center text-sm font-medium ${activeTab === "danger" ? "bg-red-50 text-red-600" : "text-gray-900 hover:bg-gray-50"}`}
              >
                <Trash2
                  className={`-ml-1 mr-3 h-6 w-6 ${activeTab === "danger" ? "text-red-500" : "text-gray-400"}`}
                />
                <span className="truncate">Danger Zone</span>
              </a>
            </nav>
          </aside>

          <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="bg-white py-6 px-4 sm:p-6 transition-colors duration-300">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Delete Account
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? All of your data
              will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
