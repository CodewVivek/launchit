import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  UserPlus,
  Rocket,
  Edit,
  Link2,
  Settings,
  LayoutGrid,
  MessageCircle,
  Bell,
  HelpCircle,
  Star,
  AlertTriangle,
  Shield,
  Users,
  Globe,
  FileText,
  Image,
  Trash2,
  RefreshCw,
  LogIn,
  LogOut,
  AlertCircle,
} from "lucide-react";

const guideSections = [
  {
    heading: "What is LaunchIT?",
    icon: <Info className="w-6 h-6 text-blue-500" />,
    content: `LaunchIT is a platform for makers, founders, and startups to showcase their projects, connect with the community, and get feedback before and after launch. You can submit your project, update it, and interact with other users.`,
  },
  {
    heading: "How do I sign up and onboard?",
    icon: <UserPlus className="w-6 h-6 text-green-500" />,
    content: `Sign up using your email or Google account. After registration, complete your profile with a bio, profile picture, and social links. This helps others connect with you and builds trust in the community.`,
  },
  {
    heading: "How do I submit a project?",
    icon: <Rocket className="w-6 h-6 text-purple-500" />,
    content: `Click the "Launch" button in the header or dashboard. Fill out the multi-step form with your project details, logo, and links. You can save your project as a draft or launch it immediately. Once launched, your project will appear on the dashboard and your profile.`,
  },
  {
    heading: "What are the requirements for submitting a project?",
    icon: <FileText className="w-6 h-6 text-blue-400" />,
    content: `You need a project name, tagline, description (within the word limit), a valid website URL, at least one media file (image or video), and a logo. Make sure your project is original and not a duplicate.`,
  },
  {
    heading: "How do drafts work?",
    icon: <Edit className="w-6 h-6 text-yellow-500" />,
    content: `You can save your project as a draft at any time. Drafts are visible only to you and can be edited or launched later. Drafts help you work on your project over multiple sessions before making it public.`,
  },
  {
    heading: "How do I edit or delete a project?",
    icon: <Edit className="w-6 h-6 text-pink-500" />,
    content: `Go to your profile, find your project, and click the edit button. You can update details, logo, and links. There is a limit to the number of edits to ensure fairness. To delete, click the delete icon and confirm. Deleted projects cannot be recovered.`,
  },
  {
    heading: "How does duplicate URL detection work?",
    icon: <Link2 className="w-6 h-6 text-indigo-500" />,
    content: `When you submit a project, the platform checks if the website URL already exists. If a duplicate is found, your submission is rejected and only the first project with that URL is accepted. This keeps the project list clean and fair.`,
  },
  {
    heading: "Can I upload a logo and images?",
    icon: <Image className="w-6 h-6 text-pink-400" />,
    content: `Yes! You can upload a logo (required) and multiple images or videos to showcase your project. Supported formats: JPG, PNG, SVG, MP4. There are size limits for uploads.`,
  },
  {
    heading: "How do I update my profile and social links?",
    icon: <Settings className="w-6 h-6 text-gray-500" />,
    content: `Go to the Settings page to update your bio, profile picture, and social links. Changes are saved instantly with feedback notifications.`,
  },
  {
    heading: "How do I use the dashboard?",
    icon: <LayoutGrid className="w-6 h-6 text-blue-400" />,
    content: `The dashboard shows all launched projects. Use the search bar to find projects by name, category, or description. Projects are grouped by date for easy browsing.`,
  },
  {
    heading: "How do I search for projects or users?",
    icon: <Search className="w-6 h-6 text-blue-500" />,
    content: `Use the search bar on the dashboard to find projects by name, category, or description. You can also search for users by their username from the profile page.`,
  },
  {
    heading: "How do I give or receive feedback?",
    icon: <MessageCircle className="w-6 h-6 text-orange-500" />,
    content: `Each project page has a comments section. You can leave feedback, ask questions, or reply to others. Be constructive and respectful!`,
  },
  {
    heading: "How do notifications and alerts work?",
    icon: <Bell className="w-6 h-6 text-yellow-400" />,
    content: `You'll see toast notifications (top right) for actions like saving, errors, or feedback. These help you know when actions are successful or if something needs attention.`,
  },
  {
    heading: "How do I report a bug or inappropriate content?",
    icon: <AlertCircle className="w-6 h-6 text-red-400" />,
    content: `Use the Suggestions page or the feedback link in the footer to report bugs or inappropriate content. You can also report comments or projects directly from their respective pages.`,
  },
  {
    heading: "What if I forget my password?",
    icon: <RefreshCw className="w-6 h-6 text-blue-400" />,
    content: `Click "Forgot password?" on the login page. You'll receive an email with instructions to reset your password. If you use Google login, use your Google account to sign in.`,
  },
  {
    heading: "How do I sign out?",
    icon: <LogOut className="w-6 h-6 text-gray-400" />,
    content: `Click your profile icon in the header, then select "Sign Out." You'll be securely logged out of your account.`,
  },
  {
    heading: "How do I delete my account?",
    icon: <Trash2 className="w-6 h-6 text-red-500" />,
    content: `Go to Settings > Delete Account. This will permanently remove your profile, projects, comments, and all associated data. This action cannot be undone.`,
  },
  {
    heading: "Tips for a Great Launch",
    icon: <Star className="w-6 h-6 text-yellow-500" />,
    content: `• Use a clear and memorable project name and logo.\n• Write a concise, engaging description (watch the word count limit).\n• Add relevant links (website, Twitter, GitHub, etc.).\n• Share your launch on social media to get more feedback.\n• Engage with comments and update your project as it grows.`,
  },
  {
    heading: "Troubleshooting & FAQ",
    icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
    content: `• Can't sign in? Try resetting your password or using Google login.\n• Project not showing? Make sure it's launched, not just saved as a draft.\n• Build errors? Check the Help Center or contact support.\n• Need more help? Reach out via the feedback link.`,
  },
  {
    heading: "Privacy & Safety",
    icon: <Shield className="w-6 h-6 text-green-600" />,
    content: `Your data is protected and only visible to others as per your profile and project settings. Please avoid sharing sensitive information publicly.`,
  },
];

const LaunchItGuide = () => {
  const [search, setSearch] = useState("");
  const [openIdx, setOpenIdx] = useState(null);

  const filteredSections = guideSections.filter(
    (section) =>
      section.heading.toLowerCase().includes(search.toLowerCase()) ||
      section.content.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16">
      <div className="max-w-3xl mx-auto px-4 pt-10">
        <div className="sticky top-20 z-10 bg-white/80 backdrop-blur rounded-xl shadow-md flex items-center gap-2 px-4 py-3 mb-8 border border-blue-100">
          <Search className="w-5 h-5 text-blue-500" />
          <input
            type="text"
            placeholder="Search LaunchIT Guide..."
            className="flex-1 bg-transparent outline-none text-lg text-gray-800 placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <h1 className="text-4xl font-extrabold text-blue-700 mb-6 text-center drop-shadow-sm">
          LaunchIT Guide & FAQ
        </h1>
        <p className="text-lg text-gray-600 mb-10 text-center">
          Your complete resource for using LaunchIT. Search or browse below for
          answers, tips, and platform walkthroughs.
        </p>
        {filteredSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <HelpCircle className="w-12 h-12 text-blue-300 mb-4 animate-bounce" />
            <div className="text-xl text-gray-400 font-medium">
              No results found for your search.
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Try a different keyword or browse the guide below.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSections.map((section, idx) => (
              <div
                key={idx}
                className={`bg-white/90 border border-blue-100 rounded-xl shadow-sm p-0 hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => handleToggle(idx)}
              >
                <div className="flex items-center gap-3 px-6 py-5">
                  <div>{section.icon}</div>
                  <h2 className="flex-1 text-lg md:text-xl font-semibold text-blue-900">
                    {section.heading}
                  </h2>
                  <span className="ml-2">
                    {openIdx === idx ? (
                      <ChevronUp className="w-5 h-5 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-blue-400" />
                    )}
                  </span>
                </div>
                {openIdx === idx && (
                  <div className="px-6 pb-6 pt-0">
                    <pre className="whitespace-pre-wrap text-base text-gray-700 font-sans leading-relaxed mt-2">
                      {section.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LaunchItGuide;
