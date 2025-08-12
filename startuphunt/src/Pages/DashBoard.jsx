import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ExternalLink, Calendar, Tag, Search, Rocket, MoreVertical } from "lucide-react";
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
        console.error("Error fetching project data", error);
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
      <div className="min-h-screen flex items-center justify-center text-gray-700 pt-16">
        Loading projects...
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
    <div className="min-h-screen pt-16">
      {Object.entries(groupedProjects).map(([dateLabel, projects]) => (
        <div key={dateLabel}>
          <h3 className="text-xl sm:text-2xl font-bold my-4 sm:my-6 mx-4 sm:mx-10 text-gray-800">
            {dateLabel}
          </h3>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
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
    <div className="group cursor-pointer" onClick={() => onProjectClick(project)}>
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

        {/* External Link */}

      </div>
    </div >
  );
};

export default Dashboard;