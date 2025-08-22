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

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Sign-in is taking longer than expected. Please try again.");
    }, 30000);

    try {
      if (!supabase.auth) {
        clearTimeout(timeoutId);
        setError("Authentication service unavailable. Please refresh the page.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://launchit.site/",
          queryParams: { access_type: "offline" },
        },
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error("OAuth Error:", error);
        setError("Failed to sign in. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Network/General Error:", err);
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          navigate("/");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="w-full h-full max-w-4xl flex flex-col items-center justify-center bg-white rounded-3xl shadow-2xl p-10">
        {/* Logo/Icon */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center rounded-full shadow-sm mb-6">
            <img
              src="/images/r6_circle_optimized.png"
              className="w-12 h-12"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to <span className="text-blue-600">Launchit</span>
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Discover and connect with amazing new startups 🚀
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 w-full max-w-md rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Google sign in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="group w-full max-w-md flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google logo"
                className="w-7 h-7"
              />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Terms & conditions */}
        <div className="text-center text-gray-500 text-sm mt-8 leading-relaxed">
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
  );
};

export default UserRegister;
