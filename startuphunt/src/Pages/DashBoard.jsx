import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ExternalLink, Tag, Search } from "lucide-react";
import Like from "../Components/Like";
import { useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";

import "../index.css";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Check if user is authenticated with proper session handling
  useEffect(() => {
    let mounted = true;
    
    const checkUser = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (!session?.user) {
            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if (mounted && event === 'SIGNED_IN' && session?.user) {
                // User signed in, stay on dashboard
                return;
              } else if (mounted && event === 'SIGNED_OUT') {
                navigate("/UserRegister");
              }
            });
            
            // If still no user after listening, redirect
            setTimeout(async () => {
              if (mounted) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  navigate("/UserRegister");
                }
              }
            }, 2000);
            
            return () => subscription.unsubscribe();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    
    checkUser();
    
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    const fetchProjectsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          setLoading(false);
          setError("Request timeout. Please refresh the page.");
        }, 10000); // 10 seconds timeout

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .neq("status", "draft");

        clearTimeout(timeoutId); // Clear timeout if successful

        if (error) {
          setError("Failed to load projects. Please try again.");
        } else {
          setProjects(data || []);
        }
      } catch (err) {
        setError("Failed to load projects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsData();
  }, []);

  // Filter projects by search query
  const projectsSearch = projects.filter(
    (project) =>
      (project.name &&
        project.name.toLowerCase().includes(search.toLowerCase())) ||
      (project.category_type &&
        project.category_type.toLowerCase().includes(search.toLowerCase())) ||
      (project.description &&
        project.description.toLowerCase().includes(search.toLowerCase())),
  );

  // Sort projects by date (descending)
  const sortProjects = [...projectsSearch].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  // Group projects by date
  const groupProjectsByDate = (projects) => {
    const groups = {};
    projects.forEach((project) => {
      const date = new Date(project.created_at);
      let label;
      if (isToday(date)) label = "Today";
      else if (isYesterday(date)) label = "Yesterday";
      else label = format(date, "d MMMM yyyy");
      if (!groups[label]) groups[label] = [];
      groups[label].push(project);
    });
    return groups;
  };
  const groupedProjects = groupProjectsByDate(sortProjects);

  const slugify = (text) =>
    text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

  const openProjectDetails = (project) => {
    navigate(`/launches/${project.slug}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 pt-16">
        Error: {error}
      </div>
    );
  }

  // Check if there are no projects
  if (projects.length === 0) {
    return (
      <div className="min-h-screen pt-4 overflow-x-hidden bg-white">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          {/* Logo with gentle bounce animation */}
          <div className="w-24 h-24 mb-8 animate-bounce">
            <img
              src="/images/r6_circle_optimized.png"
              alt="LaunchIT Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Main Heading with fade-in animation */}
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center mb-4 animate-fade-in">
            No Launches Yet
          </h2>

          {/* Description with slide-up animation */}
          <p className="text-gray-600 text-center text-lg mb-8 max-w-md animate-slide-up">
            Be the first one to launch your startup on LaunchIT!
          </p>

          {/* Launch Button with pulse animation */}
          <button
            onClick={() => navigate("/submit")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-3 animate-pulse hover:animate-none"
          >
            <img
              src="/images/r6_circle_optimized.png"
              alt="LaunchIT"
              className="w-5 h-5 object-contain"
            />
            Launch Your Startup
          </button>

          {/* Additional Info with fade-in delay */}
          <p className="text-gray-500 text-center text-sm mt-6 max-w-sm animate-fade-in-delay">
            Join the community of innovators and get feedback on your next big idea
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 overflow-x-hidden">
      {Object.entries(groupedProjects).map(([dateLabel, projects]) => (
        <div key={dateLabel}>
          <h3 className="text-xl sm:text-2xl font-bold my-4 sm:my-6 mx-3 sm:mx-4 lg:mx-10 text-gray-800">
            {dateLabel}
          </h3>
          <div className="px-3 sm:px-6 lg:px-8 xl:pl-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-3 sm:gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onProjectClick={openProjectDetails}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ProjectCard component with VideoCard styling
const ProjectCard = ({ project, onProjectClick }) => {
  return (
    <div className="
    group cursor-pointer w-full overflow-hidden mb-2 sm:mb-1  border border-gray-200 rounded-lg bg-white  sm:border-0 sm:bg-transparent  "
      onClick={() => onProjectClick(project)}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3">
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
          {project.category_type}
        </div>
      </div>

      {/* Project Info */}
      <div className="flex gap-3">
        {/* Logo */}
        <div className="flex-shrink-0">
          {project.logo_url ? (
            <img
              src={project.logo_url}
              alt={project.name}
              className="w-9 h-9 rounded-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
              <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-black font-medium text-sm leading-5 line-clamp-2 group-hover:text-black">
              {project.name}
            </h3>
            {project.website_url && (
              <a
                href={project.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors "
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="text-gray-600 text-sm mb-1">
            {project.tagline}
          </div>
        </div>
      </div>

      {/* Like Button */}
      <div className="mt-3 flex items-center justify-between">
        <div className="group-hover:scale-110 transition-transform duration-200">
          <Like projectId={project.id} iconOnly={true} />
        </div>
      </div>
    </div >
  );
};

export default Dashboard;