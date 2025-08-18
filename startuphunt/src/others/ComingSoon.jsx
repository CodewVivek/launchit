import React from "react";
import { Rocket, Clock, Bell, Users, TrendingUp, Lightbulb } from "lucide-react";

const ComingSoon = () => {
  const upcomingFeatures = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Advanced Community Features",
      description: "Enhanced networking, direct messaging, and collaboration tools for startup teams.",
      status: "In Development"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into your startup's performance and community engagement.",
      status: "Coming Soon"
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-yellow-600" />,
      title: "AI-Powered Recommendations",
      description: "Smart suggestions for investors, mentors, and potential collaborators.",
      status: "In Planning"
    },
    {
      icon: <Bell className="w-8 h-8 text-purple-600" />,
      title: "Smart Notifications",
      description: "Personalized alerts for relevant opportunities and community updates.",
      status: "Coming Soon"
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Rocket className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Coming Soon to LaunchIT
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're constantly building and improving LaunchIT to provide the best startup discovery 
            and launch platform experience. Here's what we're working on next.
          </p>
        </div>

        {/* Upcoming Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Exciting Features in Development
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {upcomingFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  {feature.icon}
                  <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {feature.status}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="text-center">
          <div className="bg-blue-50 p-8 rounded-xl border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Have Feature Ideas?
            </h2>
            <p className="text-gray-600 mb-6">
              We'd love to hear your suggestions for new features and improvements. 
              Your feedback helps shape the future of LaunchIT.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/suggestions"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Lightbulb className="w-5 h-5 mr-2" />
                Suggest Features
              </a>
              <a
                href="mailto:feedback@launchit.site"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Bell className="w-5 h-5 mr-2" />
                Get Updates
              </a>
            </div>
          </div>
        </div>

        {/* Stay Updated */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span>Last updated: August 17, 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon; 