"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/team-pulse/Sidebar";
import Topbar from "@/components/team-pulse/Topbar";
import "./team-pulse.css";

export default function TeamPulseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Exclude login page from sidebar/topbar shell
  const isLoginPage = pathname === "/team-pulse/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/team-pulse/auth/me");
        if (!res.ok) {
          router.push("/team-pulse/login");
          return;
        }
        const data = await res.json();
        if (data.authenticated) {
          setSessionUser(data.user);
        } else {
          router.push("/team-pulse/login");
        }
      } catch (err) {
        router.push("/team-pulse/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    await fetch("/api/team-pulse/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/team-pulse/login");
  };

  if (isLoginPage) {
    return <div className="tp-container">{children}</div>;
  }

  if (loading) {
    return (
      <div className="tp-container" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "var(--muted)" }}>
          <div className="tp-brand-mark" style={{ width: 44, height: 44, margin: "0 auto 12px" }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2-5 4 10 2-5h6" />
            </svg>
          </div>
          <div style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>Team Pulse</div>
          <div style={{ fontSize: 12 }}>Connecting securely…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-container">
      <div className="tp-app">
        <Sidebar
          organizationName={sessionUser?.organizationName || "Rocket India"}
          userName={sessionUser?.name || "HR Admin"}
          userRole={sessionUser?.role || "ORG_ADMIN"}
          onLogout={handleLogout}
        />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Topbar />
          <main className="tp-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
