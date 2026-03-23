"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const domainOptions = ["IT", "Marketing", "Finance", "MBA"];
const companyOptions = ["TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "Deloitte"];

export default function ProfilePage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [collegeName, setCollegeName] = useState("");
  const [domain, setDomain] = useState("IT");
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        document.cookie = "bridge_auth=; path=/; max-age=0; samesite=lax";
        router.replace("/login");
        return;
      }
      setUser(currentUser);
      document.cookie = "bridge_auth=1; path=/; max-age=2592000; samesite=lax";
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const toggleTarget = (company) => {
    setTargets((prev) => (prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]));
  };

  const logout = async () => {
    await signOut(auth);
    document.cookie = "bridge_auth=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white px-4 py-4 text-slate-900">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-[390px] items-center justify-center rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2B5CE6]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B5CE6]/30 border-t-[#2B5CE6]" />
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-4 text-slate-900">
      <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="px-4 pb-2 pt-5">
          <h1 className="text-xl font-black tracking-tight text-[#2B5CE6]">Profile</h1>
        </header>

        <main className="space-y-4 px-4 pb-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="User" className="h-12 w-12 rounded-full border border-slate-200" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3FF] font-bold text-[#2B5CE6]">
                  {(user?.displayName || "U").slice(0, 1)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.displayName || "BRIDGE User"}</p>
                <p className="text-xs text-slate-500">{user?.email || ""}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">College Name</label>
            <input
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="Enter your college name"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
            />

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
            >
              {domainOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target Companies</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {companyOptions.map((company) => (
                <button
                  key={company}
                  onClick={() => toggleTarget(company)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    targets.includes(company)
                      ? "border-[#2B5CE6] bg-[#EEF3FF] text-[#2B5CE6]"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {company}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-3 gap-2.5">
            <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">Interviews</p>
              <p className="mt-1 text-base font-bold text-slate-900">12</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">Avg Score</p>
              <p className="mt-1 text-base font-bold text-slate-900">7.4</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">Streak</p>
              <p className="mt-1 text-base font-bold text-slate-900">5 days</p>
            </article>
          </section>

          <button
            onClick={logout}
            className="w-full rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Logout
          </button>
        </main>
      </div>
    </div>
  );
}
