import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ExternalLink, Tag, Search, Rocket, Zap, ArrowRight, Check } from "lucide-react";
import Like from "../Components/Like";
import { useNavigate } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import { SEO } from "../Components/SEO";

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
              alt="Launchit Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Main Heading with fade-in animation */}
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center mb-4 animate-fade-in">
            No Launches Yet
          </h2>

          {/* Description with slide-up animation */}
          <p className="text-gray-600 text-center text-lg mb-8 max-w-md animate-slide-up">
            Be the first one to launch your startup on Launchit!
          </p>

          {/* Launch Button with pulse animation */}
          <button
            onClick={() => navigate("/submit")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-3 animate-pulse hover:animate-none"
          >
            <img
              src="/images/r6_circle_optimized.png"
              alt="Launchit"
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
    <>
      <SEO
        title="Discover Early-Stage Startups & Launch Your Project"
        description="Discover early-stage startups and launch your project on Launchit. The instant platform for startup founders to ship products, get visibility, and discover innovative projects — without gatekeeping or delays."
        keywords="early-stage startups, launch startup, discover startups, startup platform, launch project, startup discovery"
        url="https://launchit.site/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Launchit",
          "url": "https://launchit.site",
          "description": "The instant platform for startup founders who want to ship their products and get visibility",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://launchit.site/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      <div className="min-h-screen pt-4 overflow-x-hidden">
        {/* Hero Section */}
        <section className="pt-20 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200 mb-6">
              <Zap className="w-4 h-4 text-black" />
              <span className="text-sm font-medium text-gray-700"> Launch. Share. Discover. Instantly.</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-black mb-6 leading-tight">
              Discover Early-Stage Startups & Launch Your Project
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Publish your startup, get seen, and discover early-stage startups others are building — all without waiting or approval. <a href="/submit" className="text-blue-600 hover:underline font-semibold">Launch your project</a> or <a href="#projects-section" className="text-blue-600 hover:underline font-semibold">browse latest launches</a>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate("/submit")}
                className="px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-lg flex items-center gap-2 group"
              >
                Submit Your Startup
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  const projectsSection = document.getElementById('projects-section');
                  if (projectsSection) {
                    projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-8 py-4 bg-white text-black border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors font-semibold text-lg"
              >
                Browse Launches
              </button>
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>No waiting period</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>No moderator approval</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Instant visibility</span>
              </div>
            </div>
          </div>
        </section>

        {/* Existing projects list */}
        <div id="projects-section">
          <h2 className="text-3xl sm:text-4xl font-bold my-8 sm:my-10 mx-3 sm:mx-4 lg:mx-10 text-gray-900 text-center">
            Latest Startup Launches
          </h2>
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
      </div>
    </>
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


      <div className="flex gap-3">
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


      <div className="mt-3 flex items-center justify-between">
        <div className="group-hover:scale-110 transition-transform duration-200">
          <Like projectId={project.id} iconOnly={true} />
        </div>
      </div>
    </div >
  );
};

export default Dashboard;