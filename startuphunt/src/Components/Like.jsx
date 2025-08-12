import React, { useState, useEffect } from "react";
import { Rocket } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";

const Like = ({ projectId }) => {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [user, setUser] = useState(null);
  const [animateRocket, setAnimateRocket] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndLike = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: likedData } = await supabase
          .from("project_likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("project_id", projectId)
          .maybeSingle();
        setLiked(!!likedData);
      } else {
        setLiked(false);
      }
    };

    const fetchLikes = async () => {
      const { count } = await supabase
        .from("project_likes")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId);
      setCount(count || 0);
    };

    fetchUserAndLike();
    fetchLikes();
  }, [projectId]);

  const handleLike = async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "Please sign in to like projects",
        severity: "error",
      });
      return;
    }

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from("project_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", projectId);

        if (error) throw error;
        setCount((prev) => Math.max(0, prev - 1));
        setLiked(false);
      } else {
        // Like
        const { error } = await supabase
          .from("project_likes")
          .insert([{ user_id: user.id, project_id: projectId }]);

        if (error) throw error;
        setCount((prev) => prev + 1);
        setLiked(true);
        setAnimateRocket(true);
        setTimeout(() => setAnimateRocket(false), 1000);

        // Create notification for project owner
        const { data: projectData } = await supabase
          .from("projects")
          .select("user_id, name")
          .eq("id", projectId)
          .single();

        if (projectData && projectData.user_id !== user.id) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          await supabase.from("notifications").insert([
            {
              user_id: projectData.user_id,
              type: "project_like",
              title: `${userProfile?.full_name || "Someone"} liked your project`,
              project_name: projectData.name,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      setSnackbar({
        open: true,
        message: "Failed to update like",
        severity: "error",
      });
    }
  };

  return (
    <>
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
          liked
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <Rocket
          className={`w-4 h-4 ${animateRocket ? "animate-bounce" : ""}`}
        />
        {liked ? "Boosted" : "Boost"} {count}
      </button>

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
    </>
  );
};

export default Like;
