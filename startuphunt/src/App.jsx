import React, { useState, Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "./supabaseClient";
import { markSubscriptionFixesApplied, logPageSpeedImprovements } from "./utils/performanceMonitor";
import Header from "./Components/Header";
import Sidebar from "./Components/Sidebar";
import Register from "./Pages/Register";
import UserRegister from "./Pages/UserRegister";
import DashBoard from "./Pages/DashBoard";
import ProjectDetails from "./Pages/ProjectDetails";
import UserProfile from "./Pages/UserProfile";
import PitchUpload from "./Pages/PitchUpload";
import ComingSoon from "./others/ComingSoon.jsx";
import LaunchItGuide from "./others/LaunchItGuide.jsx";
import AdminDashboard from "./Pages/AdminDashboard";
import Settings from "./Components/Settings";
import TermsOfService from "./others/TermsOfService.jsx";
import PrivacyPolicy from "./others/PrivacyPolicy.jsx";
import Aboutus from "./others/Aboutus.jsx";
import Suggestions from "./others/Suggestions.jsx";
import ApprovedPitches from "./Pages/ApprovedPitchesGallery.jsx";
import MyLaunches from "./Pages/userinfoyou/MyLaunches.jsx";
import SavedProjects from "./Pages/userinfoyou/SavedProjects.jsx";
import UpvotedProjects from "./Pages/userinfoyou/UpvotedProjects.jsx";
import MyComments from "./Pages/userinfoyou/MyComments.jsx";
import FollowersFollowing from "./Pages/userinfoyou/FollowersFollowing.jsx";
import CategoryProjects from "./Pages/CategoryProjects.jsx";
import Community from "./Pages/Community.jsx";
import ScrollToTop from "./Components/ScrollToTop";
import ErrorBoundary from "./Components/ErrorBoundary";

// Lazy load heavy components
const LazyAdminDashboard = lazy(() => import("./Pages/AdminDashboard"));
const LazyPitchUpload = lazy(() => import("./Pages/PitchUpload"));
const LazyApprovedPitches = lazy(() => import("./Pages/ApprovedPitchesGallery.jsx"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function AppRoutes() {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === "/launchpage";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => setSidebarOpen((open) => !open);

  const isProjectDetailsPage = location.pathname.startsWith("/launches/");

  // Auto-close sidebar on mobile when navigating to a new page
  useEffect(() => {
    // Only auto-close on mobile devices (screen width < 1024px)
    if (window.innerWidth < 1024 && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // The main content container will have a left margin ONLY IF the sidebar is open AND it's NOT the ProjectDetails page
  const mainContentMargin = sidebarOpen && !isProjectDetailsPage ? 'lg:ml-60' : 'lg:ml-10';

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      {!hideHeaderFooter && (
        <Sidebar isOpen={sidebarOpen} isProjectDetails={isProjectDetailsPage} />
      )}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-x-hidden ${mainContentMargin}`}>
        {!hideHeaderFooter && <Header onMenuClick={handleSidebarToggle} />}
        <main className="flex-grow pt-20 sm:pt-16 w-full max-w-full overflow-x-hidden" style={{ minHeight: "100%" }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/admin" element={
                <PageFade>
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyAdminDashboard />
                  </Suspense>
                </PageFade>
              } />
              <Route path="/" element={<PageFade><DashBoard /></PageFade>} />
              <Route path="/UserRegister" element={<PageFade><UserRegister /></PageFade>} />
              <Route path="/submit" element={<PageFade><Register /></PageFade>} />
              <Route path="/launches/:slug" element={<PageFade><ProjectDetails /></PageFade>} />
              <Route path="/settings" element={<PageFade><Settings /></PageFade>} />
              <Route path="/profile/:username" element={<PageFade><UserProfile /></PageFade>} />
              <Route path="/terms" element={<PageFade><TermsOfService /></PageFade>} />
              <Route path="/privacy" element={<PageFade><PrivacyPolicy /></PageFade>} />
              <Route path="/aboutus" element={<PageFade><Aboutus /></PageFade>} />
              <Route path="/suggestions" element={<PageFade><Suggestions /></PageFade>} />
              <Route path="/launchitguide" element={<PageFade><LaunchItGuide /></PageFade>} />
              <Route path="/upload-pitch" element={
                <PageFade>
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyPitchUpload />
                  </Suspense>
                </PageFade>
              } />
              <Route path="/coming-soon" element={<PageFade><ComingSoon /></PageFade>} />
              <Route path="/my-launches" element={<PageFade><MyLaunches /></PageFade>} />
              <Route path="/saved-projects" element={<PageFade><SavedProjects /></PageFade>} />
              <Route path="/upvoted-projects" element={<PageFade><UpvotedProjects /></PageFade>} />
              <Route path="/viewed-history" element={<PageFade><ComingSoon /></PageFade>} />
              <Route path="/launch-challenges" element={<PageFade><ComingSoon /></PageFade>} />
              <Route path="/my-comments" element={<PageFade><MyComments /></PageFade>} />
              <Route path="/downloads" element={<PageFade><ComingSoon /></PageFade>} />
              <Route path="/followers-following" element={<PageFade><FollowersFollowing /></PageFade>} />
              <Route path="/approved-pitches" element={
                <PageFade>
                  <Suspense fallback={<LoadingFallback />}>
                    <LazyApprovedPitches />
                  </Suspense>
                </PageFade>
              } />
              <Route path="/category/:category" element={<PageFade><CategoryProjects /></PageFade>} />
              <Route path="/launchit-community" element={<PageFade><Community /></PageFade>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function PageFade({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-full overflow-x-hidden"
      style={{ minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  // Global cleanup for all Supabase real-time subscriptions
  useEffect(() => {
    // Mark subscription fixes as applied
    markSubscriptionFixesApplied();

    // Log performance improvements
    logPageSpeedImprovements();

    return () => {
      // Clean up all channels when app unmounts
      supabase.removeAllChannels();
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;