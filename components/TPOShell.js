"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Building2, Users, FileText, LogOut, ChevronLeft, Menu, X,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function TPOShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/tpo/login"); return; }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "tpo") {
        router.replace("/tpo/login");
        return;
      }

      setUserData(userDoc.data());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488] border-t-transparent" />
      </div>
    );
  }

  const navItems = [
    { href: "/tpo", icon: LayoutDashboard, label: "Dashboard" },
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static z-50 h-screen w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <Link href="/tpo" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">BRIDGE TPO</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* College info */}
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">College</p>
          <p className="text-sm font-semibold text-gray-800 truncate">{userData?.college || "Unknown"}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(href)
                  ? "bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#CCFBF1] flex items-center justify-center text-[#0D9488] font-bold text-sm">
              {(userData?.name || "T").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{userData?.name || "TPO"}</p>
              <p className="text-xs text-gray-400 truncate">{userData?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={() => { auth.signOut(); router.push("/tpo/login"); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl text-xs font-medium transition-colors"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-gray-900">BRIDGE TPO</span>
          <div className="w-5" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
