import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const TrendingProjects = ({ limit = 5, by = "trending" }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Enhanced trending algorithm
  const calculateTrendingScore = (project) => {
    const now = new Date();
    const ageInHours = (now - new Date(project.created_at)) / (1000 * 60 * 60);

    // Base engagement
    const engagement = project.likesCount + project.commentsCount;

    // Time decay factor (newer projects get boost)
    const timeDecay = Math.pow(ageInHours + 2, 1.5);

    // Engagement quality (projects with both likes AND comments get bonus)
    const engagementQuality = project.likesCount > 0 && project.commentsCount > 0 ? 1.2 : 1;

    // Freshness boost (projects less than 24 hours old get bonus)
    const freshnessBoost = ageInHours < 24 ? 1.5 : 1;

    // Category popularity boost (can be customized per category)
    const categoryWeight = 1;

    const trendingScore = (engagement * engagementQuality * freshnessBoost * categoryWeight) / timeDecay;

    return trendingScore;
  };

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      // Fetch all projects
      let { data: projectsData, error } = await supabase
        .from("projects")
        .select("*")
        .neq("status", "draft");
      if (error || !projectsData) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Check if there are any projects launched in last 24 hours
      const now = new Date();
      const hasRecentLaunches = projectsData.some(project => {
        const ageInHours = (now - new Date(project.created_at)) / (1000 * 60 * 60);
        return ageInHours < 24;
      });

      // If no recent launches, don't show trending projects
      if (!hasRecentLaunches && by === "trending") {
        setProjects([]);
        setLoading(false);
        return;
      }

      // For each project, fetch likes and comments count
      const projectsWithCounts = await Promise.all(
        projectsData.map(async (project) => {
          const { count: likesCount } = await supabase
            .from("project_likes")
            .select("id", { count: "exact", head: true })
            .eq("project_id", project.id);
          const { count: commentsCount } = await supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("project_id", project.id);
          return {
            ...project,
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0,
          };
        }),
      );

      // Calculate trending scores and sort
      const projectsWithTrending = projectsWithCounts.map(project => ({
        ...project,
        trendingScore: calculateTrendingScore(project)
      }));

      let sorted;
      if (by === "trending") {
        // Sort by trending score (default)
        sorted = projectsWithTrending.sort((a, b) => b.trendingScore - a.trendingScore);
      } else if (by === "comments") {
        sorted = projectsWithTrending.sort((a, b) => b.commentsCount - a.commentsCount);
      } else if (by === "likes") {
        sorted = projectsWithTrending.sort((a, b) => b.likesCount - a.likesCount);
      } else if (by === "newest") {
        sorted = projectsWithTrending.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else {
        // Default to trending
        sorted = projectsWithTrending.sort((a, b) => b.trendingScore - a.trendingScore);
      }

      setProjects(sorted.slice(0, limit));
      setLoading(false);
    };
    fetchTrending();
  }, [limit, by]);

  if (loading)
    return (
      <div className="text-gray-400 py-4">
        Loading trending projects...
      </div>
    );
  if (!projects.length)
    return (
      <div className="text-gray-400 py-4">
        No recent launches to trend.
      </div>
    );

  return (
    <div className="mt-2">
      <div className="font-semibold text-md mb-5 text-gray-800">
        🔥 Trending Launches (Last 24h)
      </div>
      <div className="flex flex-col gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-gray-300 p-3 flex gap-3 items-center cursor-pointer hover:shadow-md transition-all duration-300 bg-white hover:bg-gray-50"
            onClick={() => navigate(`/launches/${project.slug}`)}
          >
            {project.logo_url ? (
              <img
                src={project.logo_url}
                alt="Logo"
                className="w-12 h-12 object-contain rounded-lg border bg-gray-50"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold border">
                <span>L</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-md font-semibold text-gray-900 truncate">
                {project.name}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {project.tagline}
              </p>
              <div className="flex gap-3 mt-1 text-xs text-gray-500">
                <span>🚀 {project.likesCount}</span>
                <span>💬 {project.commentsCount}</span>
                {by === "trending" && (
                  <span title={`Trending Score: ${project.trendingScore?.toFixed(2)}`}>
                    🔥 Trending
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingProjects;