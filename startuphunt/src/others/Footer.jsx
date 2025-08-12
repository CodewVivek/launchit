import React from "react";
import { Link } from "react-router-dom";
import { Rocket, Twitter, Linkedin, Github, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto text-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-black">Launch</span>
                <span className="text-blue-600">IT</span>
              </span>
            </Link>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Connecting innovative startups with the resources they need to
              succeed. Discover, launch, and grow your next big idea.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:skypher206@gmail.com"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-gray-900 text-lg mb-4">
              Platform
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/submit"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Submit Startup
                </Link>
              </li>

              <li>
                <a
                  href="https://www.tg10x.com/"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Startup Jobs
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-gray-900 text-lg mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/news"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/aboutus"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/launchitguide"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  LaunchIT Guide
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-gray-900 text-lg mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/aboutus"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 text-xs">
            <div className="flex items-center text-sm text-gray-500">
              <span>
                © {new Date().getFullYear()} Launch It. All rights reserved.
              </span>
            </div>
            <Link
              to="/suggestions"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Suggestions / Feedback
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
