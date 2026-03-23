"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        document.cookie = "bridge_auth=1; path=/; max-age=2592000; samesite=lax";
        router.replace("/dashboard");
        return;
      }
      document.cookie = "bridge_auth=; path=/; max-age=0; samesite=lax";
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white px-4 py-4 text-slate-900">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-[390px] items-center justify-center rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2B5CE6]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B5CE6]/30 border-t-[#2B5CE6]" />
            Checking your session...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] px-4 py-4 text-slate-900">
      <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="px-5 pt-8 text-center">
          <p className="text-4xl font-black tracking-tight text-[#2B5CE6]">BRIDGE</p>
          <p className="mt-2 text-sm font-medium text-slate-500">Your AI Placement Partner</p>
        </header>

        <main className="px-5 pb-10 pt-6">
          <section className="flex h-44 items-center justify-center rounded-3xl bg-gradient-to-br from-[#EEF3FF] via-white to-[#FFF5F1] shadow-inner">
            <span className="text-6xl">🚀</span>
          </section>

          <section className="mt-7 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Placement prep made smarter</h1>
            <p className="mt-2 text-sm text-slate-500">
              Practice interviews, track PULSE trends, and improve communication daily.
            </p>
          </section>

          <Link
            href="/login"
            className="mt-8 block w-full rounded-2xl bg-[#2B5CE6] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(43,92,230,0.35)] transition hover:brightness-105"
          >
            Get Started
          </Link>
        </main>
      </div>
    </div>
  );
}
