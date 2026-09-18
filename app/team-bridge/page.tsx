"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TeamBridgeAccessPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("team_bridge_unlocked") === "true") {
      router.push("/team-pulse");
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      if (password === "Billiondollar") {
        sessionStorage.setItem("team_bridge_unlocked", "true");
        document.cookie = "team_bridge_unlocked=true; path=/";
        router.push("/team-pulse");
      } else {
        setError(true);
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #0f172a 0%, #090d16 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#fff"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 24,
        padding: "36px 32px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(13, 148, 136, 0.15)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 20px rgba(13, 148, 136, 0.3)",
            marginBottom: 16
          }}>
            <Lock style={{ width: 26, height: 26, color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", margin: "0 0 6px 0" }}>
            Team Bridge Gate
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            Restricted Enterprise Access. Enter your security password to open <b>Team Pulse</b>.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Security Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Enter password..."
                autoFocus
                style={{
                  width: "100%",
                  height: 48,
                  padding: "0 44px 0 16px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.06)",
                  border: error ? "1.5px solid #ef4444" : "1.5px solid rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "#fca5a5"
            }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, color: "#ef4444" }} />
              Incorrect password. Please enter the correct password.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              background: password ? "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)" : "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: password ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: password ? "0 4px 14px rgba(13, 148, 136, 0.4)" : "none",
              transition: "all 0.2s ease",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              "Authenticating..."
            ) : (
              <>
                Access Team Pulse <ArrowRight style={{ width: 18, height: 18 }} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center" }}>
          <Link href="/" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>
            ← Back to Bridge AI Home
          </Link>
        </div>
      </div>
    </div>
  );
}
