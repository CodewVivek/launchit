import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowBigRight, ArrowBigLeft, ExternalLink, Flag, Calendar, UserPlus, UserCheck, Bookmark, BookmarkCheck } from 'lucide-react';
import Like from '../Components/Like';
import Share from '../Components/Share';
import ReportModal from '../Components/ReportModal';
import Comments from '../Components/Comments';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import RelatedProjects from '../Components/RelatedProjects';
import TrendingProjects from '../Components/TrendingProjects';
import PopularProjects from '../Components/PopularProjects';
import toast from 'react-hot-toast';


const NextArrow = ({ onClick, style, ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10 bg-gray-200/80 hover:bg-gray-200 shadow rounded-full p-2 flex items-center justify-center"
    style={{ ...style }}
    aria-label="Next image"
  >
    <ArrowBigRight className="w-6 h-6 text-gray-700" />
  </button>
);

const PrevArrow = ({ onClick, style, ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10 bg-gray-200/80 hover:bg-gray-200 shadow rounded-full p-2 flex items-center justify-center"
    style={{ ...style }}
    aria-label="Previous image"
  >
    <ArrowBigLeft className="w-6 h-6 text-gray-700" />
  </button>
);

// Helper to get link label
function getLinkLabel(url) {
  if (!url) return 'Website';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('github.com')) return 'GitHub';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('play.google.com')) return 'Play Store';
  if (url.includes('apps.apple.com')) return 'App Store';
  return 'Website';
}

const ProjectDetails = () => {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [creator, setCreator] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // Modal state for image lightbox
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // New state for follow and save functionality
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {

      } else {
        setProject(data);



        if (data && data.user_id) {

          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .eq('id', data.user_id)
            .maybeSingle();

          if (userError) {

          } else {

            setCreator(userData);
          }
        }
      }

      setLoading(false);
    };

    fetchProject();
  }, [slug]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        if (!profile || !profile.full_name || !profile.avatar_url) {
          await supabase.from('profiles').update({
            full_name: user.user_metadata.full_name,
            avatar_url: user.user_metadata.avatar_url
          }).eq('id', user.id);
        }
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user && project) {
        // Check if user is following the creator
        if (creator) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', creator.id)
            .maybeSingle();

          setIsFollowing(!!followData);
        }

        // Check if user has saved this project
        const { data: saveData } = await supabase
          .from('saved_projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('project_id', project.id)
          .maybeSingle();

        setIsSaved(!!saveData);
      }
    };

    checkUser();
  }, [project, creator]);

  // Modal navigation handlers
  const openModal = idx => { setModalIndex(idx); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);
  const prevModal = () => setModalIndex(i => (i === 0 ? project.cover_urls.length - 1 : i - 1));
  const nextModal = () => setModalIndex(i => (i === project.cover_urls.length - 1 ? 0 : i + 1));

  // Keyboard navigation for modal
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prevModal();
      if (e.key === 'ArrowRight') nextModal();
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen, project?.cover_urls?.length]);


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 py-10 px-2 md:px-6 mt-10 animate-pulse">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-center justify-center w-full max-w-2xl p-6 text-center mx-auto">
            <div className="h-16 w-16 bg-gray-200 rounded-2xl mx-auto mb-4" />
            <div className="h-10 w-64 bg-gray-200 rounded mx-auto mb-2" />
            <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-4" />
            <div className="h-12 w-40 bg-gray-200 rounded-full mx-auto mb-6" />
          </div>
          <div className="h-6 w-full bg-gray-200 rounded mb-6" />
          <div className="h-[400px] w-full bg-gray-200 rounded-xl" />
        </div>
        <div className="w-full md:w-80">
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }
  if (!project) return <div>Project not found</div>;

  // Follow functionality
  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }

    if (!creator) {
      toast.error("Creator not found");
      return;
    }

    if (user.id === creator.id) {
      toast.error("You cannot follow yourself");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creator.id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success(`Unfollowed ${creator.full_name || creator.username}`);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: creator.id
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success(`Following ${creator.full_name || creator.username}`);
      }
    } catch (error) {

      toast.error(isFollowing ? 'Failed to unfollow' : 'Failed to follow');
    } finally {
      setFollowLoading(false);
    }
  };

  // Save functionality
  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save projects");
      return;
    }

    setSaveLoading(true);
    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_projects')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', project.id);

        if (error) throw error;
        setIsSaved(false);
        toast.success("Removed from saved projects");
      } else {
        // Save project
        const { error } = await supabase
          .from('saved_projects')
          .insert({
            user_id: user.id,
            project_id: project.id
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success("Project saved!");
      }
    } catch (error) {

      toast.error(isSaved ? 'Failed to remove from saved' : 'Failed to save project');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 py-4 sm:py-6 lg:py-10 px-3 sm:px-4 lg:px-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 justify-center">
            <div className="flex flex-col items-center justify-center w-full max-w-2xl p-3 sm:p-4 lg:p-6 text-center">
              {project.logo_url && (
                <img
                  src={project.logo_url}
                  alt={`${project.name} logo`}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-2 sm:border-4 border-gray-300 shadow-lg object-contain mx-auto mb-2"
                  width={64}
                  height={64}
                  loading="eager"
                />
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800 mb-2 px-2">
                {project.name}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-medium px-2">
                {project.tagline}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center mt-4">
                <a
                  href={`${project.website_url}${project.website_url.includes('?') ? '&' : '?'
                    }ref=launchit`}
                  target="_blank"
                  rel="noopener"
                  className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow transition text-sm sm:text-base lg:text-lg flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5" />
                  Launch {project.name}
                </a>

                <div className="rounded-full shadow-sm hover:shadow-md border border-gray-200 transition-all duration-300 inline-flex items-center justify-center">
                  <Like projectId={project.id} />
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-md lg:text-lg text-gray-700 mb-6 whitespace-pre-line px-2">{project.description}</p>
          {/* Images */}
          {project.cover_urls && project.cover_urls.length > 0 && (
            <div className="mb-6 sm:mb-10 relative px-2">
              <Slider
                dots={true}
                infinite={project.cover_urls.length > 1}
                speed={500}
                slidesToShow={1}
                slidesToScroll={1}
                nextArrow={project.cover_urls.length > 1 ? <NextArrow /> : null}
                prevArrow={project.cover_urls.length > 1 ? <PrevArrow /> : null}
                swipeToSlide={true}
                adaptiveHeight={false}
                className="rounded-xl overflow-hidden"
                responsive={[
                  {
                    breakpoint: 768,
                    settings: {
                      arrows: false,
                      dots: true
                    }
                  }
                ]}
              >
                {project.cover_urls.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative flex justify-center items-center w-full aspect-video rounded-xl overflow-hidden cursor-zoom-in transition-all"
                    onClick={() => openModal(idx)}
                  >
                    <img
                      src={url}
                      alt={`Cover ${idx + 1}`}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      width={800}
                      height={450}
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </Slider>

              {/* Lightbox Modal */}
              {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                  {/* Close button */}
                  <button
                    className="absolute top-4 right-4 text-white text-4xl font-bold bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    &times;
                  </button>

                  {/* Prev button */}
                  {project.cover_urls.length > 1 && (
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-200/90 hover:bg-gray-200 shadow-lg rounded-full p-2 z-10 transition"
                      onClick={prevModal}
                      aria-label="Previous image"
                    >
                      <ArrowBigLeft className="w-4 h-4 text-gray-700" />
                    </button>
                  )}

                  {/* Image */}
                  <img
                    src={project.cover_urls[modalIndex]}
                    alt={`Cover ${modalIndex + 1}`}
                    className="max-h-[85vh] max-w-[95vw] rounded-xl shadow-2xl object-contain bg-gray-200 transition duration-300"
                  />

                  {/* Next button */}
                  {project.cover_urls.length > 1 && (
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-200/90 hover:bg-gray-200 shadow-lg rounded-full p-2 z-10 transition"
                      onClick={nextModal}
                      aria-label="Next image"
                    >
                      <ArrowBigRight className="w-4 h-4 text-gray-700" />
                    </button>
                  )}
                </div>
              )}
            </div>

          )}
          {/* Comments */}
          <div className="rounded-xl shadow p-3 sm:p-4 lg:p-6 mb-6 sm:mb-10">
            <h2 className="text-lg font-bold mb-4">Comments</h2>
            <Comments projectId={project.id} className="mt-10" />
          </div>
          <RelatedProjects
            categoryType={project.category_type} excludeProjectId={project.id} />
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)} projectId={project.id}
            projectName={project.name}
          />
        </div>
        {/* Right/Sidebar Section */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="p-[2px] rounded-xl bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300 mb-4 sm:mb-6 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow duration-300">

            <div className="bg-white rounded-xl shadow p-3 sm:p-4 lg:p-6 border border-gray-100">
              {/* launch Info */}
              <h2 className="text-lg font-bold mb-4">Launch Info</h2>
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4" />
                <a href={`${project.website_url}${project.website_url.includes('?') ? '&' : '?'
                  }ref=launchit`}
                  target="_blank"
                  rel="noopener"
                  className="text-blue-700 hover:underline truncate text-sm break-all">
                  {project.website_url}
                </a>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Launched on {formatDate(project.created_at)}</span>
              </div>
              {/* Share */}
              <div className="mb-4">
                <Share projectSlug={project.slug} projectName={project.name} />
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Launcher</h3>
                {creator && (
                  <div className="space-y-3">
                    <Link to={`/profile/${creator.username}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                      <img
                        src={creator.avatar_url || '/default-avatar.png'}
                        alt="creator avatar"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border object-cover"
                        loading="eager"
                        decoding="async"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {creator.full_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500">View profile</p>
                      </div>
                    </Link>
                    {/* Follow Button */}
                    {user && user.id !== creator?.id && (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-gray-700 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="text-sm truncate">
                          {isFollowing
                            ? 'Following'
                            : `Follow ${creator?.full_name || creator?.username || 'User'}`}
                        </span>
                      </button>
                    )}
                  </div>
                )}
                {/* Save Project Button */}
                {user && user.id !== project.user_id && (
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-gray-700 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span className="text-sm truncate">
                      {isSaved ? 'Saved' : 'Add to collection'}
                    </span>
                  </button>
                )}
                {user && user.id !== project.user_id && (
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-gray-700 hover:text-orange-600 transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                    <span className="text-sm truncate">Report</span>
                  </button>
                )}
              </div>
              {/* Built With */}
              {project.built_with && project.built_with.length > 0 && (
                <div className="mb-4">
                  <span className="font-semibold text-sm">Built With:</span>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                    {project.built_with.map((tech, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium break-words">{tech}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="mb-4">
                  <span className="font-semibold text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                    {project.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium break-words">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Links */}
              {project.links && project.links.length > 0 && (
                <div className="mb-4">
                  <span className="font-semibold text-sm">Links:</span>
                  <div className="mt-1 gap-2 sm:gap-3 flex flex-wrap">
                    {project.links.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline text-xs truncate max-w-[120px] sm:max-w-[150px]"
                        >
                          {getLinkLabel(link)}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <TrendingProjects limit={5} by="trending" />
          <PopularProjects limit={5} />
        </aside>
      </div>


    </div>
  );
};

export default ProjectDetails;