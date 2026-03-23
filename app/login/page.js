"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setIsLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Sign-in failed. Please try again in a moment.";
      setErrorMessage("Unable to sign in with Google. Please try again.");
      if (process.env.NODE_ENV !== "production") {
        // Keep detailed message available during local development.
        console.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[390px] flex-col rounded-[28px] border border-slate-100 bg-white px-5 pb-6 pt-8 shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="text-center">
          <p className="text-4xl font-black tracking-tight text-[#2B5CE6]">BRIDGE</p>
          <p className="mt-2 text-sm font-medium text-slate-500">Your AI Placement Partner</p>
        </header>

        <section className="mt-8 flex flex-1 flex-col">
          <div className="flex h-40 items-center justify-center rounded-3xl bg-gradient-to-br from-[#EEF3FF] via-white to-[#FFF5F1] shadow-inner">
            <span className="text-6xl" aria-hidden="true">
              🎯
            </span>
          </div>

          <div className="mt-7 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Welcome to BRIDGE</h1>
            <p className="mt-2 text-sm text-slate-500">Join 25,000+ students preparing smarter</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#2B5CE6]" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#FF6B35]">
                G
              </span>
            )}
            {isLoading ? "Signing you in..." : "Continue with Google"}
          </button>

          {errorMessage && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700">
              {errorMessage}
            </p>
          )}
        </section>

        <footer className="mt-8 text-center">
          <p className="text-xs leading-relaxed text-slate-500">
            By continuing you agree to our <span className="font-semibold text-[#2B5CE6]">Terms</span> &{" "}
            <span className="font-semibold text-[#FF6B35]">Privacy Policy</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
