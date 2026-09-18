"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Play } from "lucide-react";

interface TopbarProps {
  onStartTour?: () => void;
}

export default function Topbar({ onStartTour }: TopbarProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/team-pulse/copilot?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="tp-topbar">
      <div className="tp-ask">
        <Sparkles style={{ width: 17, height: 17, color: "var(--violet)", flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask HR Copilot, e.g. “Who is most likely to leave?”"
          autoComplete="off"
        />
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: 12,
          fontWeight: 600,
          padding: "6px 11px",
          borderRadius: 99,
          background: "var(--green-soft)",
          border: "1px solid #bfe9d9",
          color: "var(--green-ink)",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6" }} />
        <span>AI demo answers</span>
      </div>

      <button className="tp-btn tp-btn-primary" style={{ fontSize: "12.5px", padding: "6px 10px" }} onClick={onStartTour}>
        <Play style={{ width: 14, height: 14, fill: "currentColor" }} />
        Demo tour
      </button>
    </header>
  );
}
