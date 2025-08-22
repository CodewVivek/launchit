import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    // Add timeout to prevent stuck loading state
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Sign-in is taking longer than expected. Please try again.");
    }, 30000); // 30 second timeout

    try {
      // Check if Supabase auth is available
      if (!supabase.auth) {
        clearTimeout(timeoutId);
        setError("Authentication service unavailable. Please refresh the page.");
        setLoading(false);
        return;
      }

      //google sign in with proper redirect
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://launchit.site/",
          queryParams: { access_type: "offline" },
        },
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error('OAuth Error:', error);
        setError("Failed to sign in. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Network/General Error:', err);
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  // Handle auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigate("/");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center  rounded-full shadow-sm mb-5">
              <img src="/images/r6_circle_optimized.png" className="w-8 h-8" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to <span className="text-blue-600">Launchit</span>
            </h1>
            <p className="text-gray-500 mt-2 text-base">
              Discover and connect with amazing new startups 🚀
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Google sign in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="group w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Signing in...</span>
              </>
            ) : (
              <>
                <img
                  src="https://www.svgrepo.com/show/355037/google.svg"
                  alt="Google logo"
                  className="w-6 h-6"
                />
                <span className="text-base font-medium">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* Terms & conditions */}
          <div className="text-center text-gray-500 text-xs mt-6 leading-relaxed">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="font-semibold text-blue-600 hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="font-semibold text-blue-600 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegister; 