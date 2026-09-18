"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("hr@rocketindia.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/team-pulse/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setSubmitting(false);
        return;
      }

      router.push("/team-pulse");
    } catch (err) {
      setError("Server connection error. Please try again.");
      setSubmitting(false);
    }
  };

  const setTestAccount = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--tint)",
        padding: 20,
      }}
    >
      <div
        className="tp-panel lift"
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 20,
          padding: 32,
          border: "1px solid var(--line2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div className="tp-brand-mark" style={{ width: 42, height: 42 }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2-5 4 10 2-5h6" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>
              TEAM PULSE
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>by Bridge AI</div>
          </div>
        </div>

        <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 24, lineHeight: 1.5 }}>
          Sign in to access your company workforce intelligence dashboard and HR automation tools.
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--crit-soft)",
              color: "var(--crit)",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)" }}>Employee / User Email</label>
            <div style={{ position: "relative" }}>
              <User style={{ position: "absolute", left: 12, top: 11, width: 16, height: 16, color: "var(--faint)" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={{
                  width: "100%",
                  border: "1px solid var(--line2)",
                  borderRadius: 10,
                  padding: "9px 11px 9px 36px",
                  outline: 0,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)" }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock style={{ position: "absolute", left: 12, top: 11, width: 16, height: 16, color: "var(--faint)" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  border: "1px solid var(--line2)",
                  borderRadius: 10,
                  padding: "9px 11px 9px 36px",
                  outline: 0,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="tp-btn tp-btn-primary"
            style={{ width: "100%", padding: 11, fontSize: 14, marginTop: 8 }}
          >
            {submitting ? "Signing in…" : "Sign In to Team Pulse"}
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </form>

        <div style={{ margin: "24px 0 16px", height: 1, background: "var(--line)" }} />

        <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: "var(--faint)", letterSpacing: ".08em", marginBottom: 10 }}>
          Development Quick Login (Rocket India)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => setTestAccount("hr@rocketindia.com", "password123")}
            className="tp-btn"
            style={{ justifyContent: "flex-start", fontSize: 12.5, padding: "8px 10px" }}
          >
            <ShieldCheck style={{ width: 15, height: 15, color: "var(--indigo)" }} />
            <span>
              <b>HR Admin:</b> hr@rocketindia.com
            </span>
          </button>
          <button
            onClick={() => setTestAccount("manager@rocketindia.com", "password123")}
            className="tp-btn"
            style={{ justifyContent: "flex-start", fontSize: 12.5, padding: "8px 10px" }}
          >
            <ShieldCheck style={{ width: 15, height: 15, color: "var(--rose)" }} />
            <span>
              <b>Hiring Manager:</b> manager@rocketindia.com
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
