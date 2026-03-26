"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { Users } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        document.cookie = "bridge_auth=1; path=/; max-age=2592000; samesite=lax";
        router.replace("/dashboard");
        return;
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setIsLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      document.cookie = "bridge_auth=1; path=/; max-age=2592000; samesite=lax";
      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Sign-in failed. Please try again in a moment.";
      setErrorMessage("Unable to sign in with Google. Please try again.");
      if (process.env.NODE_ENV !== "production") {
        console.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
          <div className="text-purple-400 font-semibold">Checking session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] relative overflow-hidden">
      {/* Purple gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Glassmorphism login card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            {/* Logo */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2" style={{ textShadow: '0 0 20px #6C63FF' }}>
                BRIDGE
              </h1>
              <p className="text-gray-300 text-sm">Your AI Placement Partner</p>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2 mb-8 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">Join 25,000+ students</span>
            </div>

            {/* Hero icon */}
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg" style={{ boxShadow: '0 10px 25px -5px rgba(108, 99, 255, 0.5)' }}>
                <span className="text-3xl">🎯</span>
              </div>
            </div>

            {/* Welcome text */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to BRIDGE</h2>
              <p className="text-gray-400 text-sm">Start your journey to top companies</p>
            </div>

            {/* Google sign-in button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}
            >
              {isLoading ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">G</span>
                </div>
              )}
              {isLoading ? "Signing you in..." : "Continue with Google"}
            </button>

            {/* Error message */}
            {errorMessage && (
              <div className="mt-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                {errorMessage}
              </div>
            )}

            {/* Terms */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400 leading-relaxed">
                By continuing you agree to our{" "}
                <span className="font-semibold text-purple-400">Terms</span> &{" "}
                <span className="font-semibold text-purple-400">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
