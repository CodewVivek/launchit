import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ExternalLink, Tag, Search, Rocket } from "lucide-react";
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

  useEffect(() => {
    const fetchProjectsData = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .neq("status", "draft");
      if (error) {
        
        setError("Failed to load projects. Please try again.");
      } else {
        setProjects(data);
      }
      setLoading(false);
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
      <div className="min-h-screen pt-4 overflow-x-hidden">
        <h3 className="text-xl sm:text-2xl font-bold my-4 sm:my-6 mx-3 sm:mx-4 lg:mx-10 text-gray-800">
          Loading Projects...
        </h3>
        <div className="px-3 sm:px-6 lg:px-8 xl:pl-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse w-full mb-2 sm:mb-1 border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                {/* Thumbnail skeleton */}
                <div className="relative aspect-video bg-gray-200 rounded-t-lg" />

                {/* Project Info skeleton */}
                <div className="flex gap-3 p-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>

                {/* Button/like skeleton */}
                <div className="px-3 pb-3">
                  <div className="h-6 w-12 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
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
            <Rocket className="w-12 h-12" />
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
              <Rocket className="w-5 h-5 text-gray-500" />
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