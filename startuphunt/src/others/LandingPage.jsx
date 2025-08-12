import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Play,
  Search,
  Users,
  TrendingUp,
  User,
  Megaphone,
  ArrowRight,
  Check,
  Menu,
  X,
  Telescope,
  Zap,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Search,
      title: "Smart Search",
      desc: "Find the perfect match with our robust search using industry and funding filters.",
    },
    {
      icon: Users,
      title: "Team Building",
      desc: "Connect with top talent through our integrated job board and hiring tools.",
    },
    {
      icon: TrendingUp,
      title: "Growth Analytics",
      desc: "Track your progress with detailed analytics and actionable insights.",
    },
    {
      icon: User,
      title: "Showcase Profiles",
      desc: "Create detailed profiles highlighting your mission, team, and funding stage.",
    },
    {
      icon: Zap,
      title: "AI Recommendations",
      desc: "Receive personalized suggestions for investors, talent, and resources.",
    },
    {
      icon: Megaphone,
      title: "Marketing Tools",
      desc: "Amplify your brand with integrated marketing and discoverability tools.",
    },
  ];

  const aiFeatures = [
    {
      title: "Investor Matching AI",
      desc: "Our algorithm analyzes your startup's profile and matches you with investors who have a history of funding similar ventures.",
    },
    {
      title: "Smart Assistant",
      desc: "Get instant answers to your questions about fundraising, growth strategies, and market opportunities.",
    },
    {
      title: "Predictive Analytics",
      desc: "Forecast your growth trajectory and identify potential challenges before they arise.",
    },
    {
      title: "Content Generator",
      desc: "Create compelling pitch decks, marketing materials, and investor updates with AI-powered templates.",
    },
  ];

  useEffect(() => {
    // Save old margin value (just in case)
    const oldMarginBottom = document.body.style.marginBottom;

    // Set margin to 0 on landing page
    document.body.style.margin = "0";
    document.body.style.marginBottom = "0";

    return () => {
      // Restore original when leaving landing page
      document.body.style.marginBottom = oldMarginBottom;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden ">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? "bg-slate-900/95 backdrop-blur-lg border-b border-purple-500/20" : "bg-transparent"}`}
      >
        <div className=" px-4 sm:px-6 lg:px-8 m-0">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Telescope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Launch
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="hover:text-purple-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="hover:text-purple-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#benefits"
                className="hover:text-purple-400 transition-colors"
              >
                Benefits
              </a>
              <a
                href="#ai-tools"
                className="hover:text-purple-400 transition-colors"
              >
                AI Tools
              </a>
              <button
                className="bg-gradient-to-r from-purple-600 to-cyan-600 px-6 py-2 rounded-full hover:from-purple-700 hover:to-cyan-700 transition-all transform hover:scale-105"
                onClick={() => navigate("/")}
              >
                Get Started
              </button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-purple-500/20">
            <div className="px-4 py-4 space-y-4">
              <a
                href="#features"
                className="block hover:text-purple-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block hover:text-purple-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#benefits"
                className="block hover:text-purple-400 transition-colors"
              >
                Benefits
              </a>
              <a
                href="#ai-tools"
                className="block hover:text-purple-400 transition-colors"
              >
                AI Tools
              </a>
              <button
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 px-6 py-2 rounded-full hover:from-purple-700 hover:to-cyan-700 transition-all"
                onClick={() => navigate("/")}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">AI Match Found</span>
              <span className="text-cyan-400 font-medium">
                3 investors interested in your AI startup
              </span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent leading-tight">
            <span className="text-black">Launch</span>
            <span className="text-blue-600">IT</span>
          </h1>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light mb-8 text-gray-300">
            Connecting Startups with
            <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-semibold">
              Growth Opportunities
            </span>
          </h2>

          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Empower your startup with AI-driven tools to connect with investors,
            talent, and customers — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              className="group bg-gradient-to-r from-purple-600 to-cyan-600 px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
              onClick={() => navigate("/UserSign")}
            >
              Start Growing
              <ArrowRight className="inline ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
                <Play className="w-5 h-5 ml-1" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="animate-bounce">
            <ChevronDown className="w-8 h-8 mx-auto text-gray-400" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Platform Features
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Everything You Need to Accelerate Growth
            </p>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              Our comprehensive toolkit helps startups connect with the right
              resources at the right time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-rfrom-slate-800/50 to-slate-900/50 border-slate-700/50 "
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-white mb-4">
              How Skypher Works
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A sleek 4-step journey to launch, connect, and grow — now with a
              smarter, modern touch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: "1",
                title: "Create Your Profile",
                desc: "Register and showcase your startup's unique value proposition, team, and current stage.",
              },
              {
                num: "2",
                title: "Find Connections",
                desc: "Use our smart filters to discover investors, talent, and customers aligned with your goals.",
              },
              {
                num: "3",
                title: "Grow Your Network",
                desc: "Engage with your connections and leverage AI-powered tools to maximize opportunities.",
              },
              {
                num: "4",
                title: "Achieve Success",
                desc: "Track your progress, receive insights, and celebrate milestones on your growth journey.",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="relative p-6 bg-slate-900/70 rounded-xl border border-slate-700 hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 group"
              >
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                  {step.num}
                </div>
                <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors">
                  {step.title}
                </h4>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Why Choose Skypher Over SoloPush & Product Hunt?
              </h2>
              <p className="text-xl text-gray-300 mb-4 font-bold">
                Some ideas change everything. Ours just did.
              </p>
              <p className="text-gray-500 mb-6">
                Unlike SoloPush (which targets solo makers) or Product Hunt
                (focused on daily product launches), Skypher delivers a
                comprehensive growth ecosystem: personalized investor matching,
                advanced talent hiring tools, AI-powered growth analytics, and
                exclusive founder resources — designed for long-term impact, not
                just short-term hype.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Personalized investor matches — beyond public listings",
                  "Dedicated hiring tools, not just promotion boards",
                  "AI-driven analytics for continuous growth",
                  "Exclusive founder resources and ongoing support",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-300">{benefit}</p>
                  </div>
                ))}
              </div>

              <button
                className="bg-gradient-to-r from-purple-600 to-cyan-600 px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all transform hover:scale-105"
                onClick={() => navigate("/UserSign")}
              >
                Start Your Journey
              </button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    How Skypher Works
                  </h3>
                  <p className="text-gray-400 mb-4">
                    1️⃣ Sign up and tell us about your startup.
                    <br />
                    2️⃣ Instantly get matched with investors, talent, and
                    customers.
                    <br />
                    3️⃣ Use our AI tools to track and optimize your growth
                    journey.
                  </p>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text">
                      Faster, Smarter, Better
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section
        id="ai-tools"
        className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900/30 to-slate-800/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              AI-Powered Features{" "}
              <span className="ml-2 px-3 py-1 overflow-auto text-sm bg-yellow-500 text-black rounded-full">
                COMING SOON
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Intelligent Tools for Smarter Growth
            </p>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              Our upcoming AI suite will empower you to make data-driven
              decisions, uncover hidden opportunities, and supercharge your
              startup's growth journey — stay tuned!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {feature.desc}
                </p>
                <button className="group-hover:text-purple-400 transition-colors flex items-center space-x-2">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Ready to Accelerate Your Startup's Growth?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of founders who are building the next generation of
            successful companies.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Skypher
                </span>
              </div>
              <p className="text-gray-400">
                Empowering startups to connect with investors, talent, and
                customers to fuel growth.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    AI Tools
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Resources
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2025 Skypher All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
