import React from 'react';
import { Mail, Settings, Sunrise } from 'lucide-react';

const CommunityComingSoon = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center p-3 sm:p-4 overflow-x-hidden">
      <div className="absolute inset-0"></div>
      <div className="relative max-w-4xl mx-auto space-y-6 sm:space-y-8 z-10 text-center px-2">
        <div className="flex items-center justify-center space-x-3 sm:space-x-6 animate-fade-in">
          <Settings className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-indigo-600 animate-spin-slow" />
          <div className="text-4xl sm:text-6xl lg:text-8xl font-extrabold text-gray-900 drop-shadow-md">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">Building</span>
          </div>
          <Sunrise className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-yellow-500 animate-pulse-slow" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tighter mt-6 sm:mt-8 animate-fade-in-up px-2">
          Our New Community is
          <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Coming Soon.</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mt-4 sm:mt-6 animate-fade-in-up-delay px-2">
          We are crafting a new digital space for you to connect, collaborate, and grow.
          Get ready for a fresh experience.
        </p>

      </div>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animate-fade-in-up-delay {
          animation: fade-in-up 0.8s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animate-fade-in-up-delay-2 {
          animation: fade-in-up 0.8s ease-out forwards;
          animation-delay: 0.6s;
          opacity: 0;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CommunityComingSoon;