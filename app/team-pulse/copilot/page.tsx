"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Send, Sparkles, FileText, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function HRCopilotPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your **Team Pulse HR Copilot**. I have access to your organization's employees, candidate pipeline, open job roles, performance ratings, and compliance records.\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          history: messages,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I ran into an error processing your query. Please try again." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Server connection failed. Please check your network." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "Who are the top candidates for Senior Data Analyst, and what offer should I make?",
    "Which high performers are at high flight risk and why?",
    "Who is eligible for promotion in this appraisal cycle?",
    "Which employees are overdue on mandatory POSH training?",
    "Draft a hybrid work policy for Rocket India.",
  ];

  const documentTemplates = [
    { label: "Offer Letter", prompt: "Draft a formal offer letter for Sneha Kulkarni for Senior Data Analyst." },
    { label: "Rejection Email", prompt: "Draft a polite rejection email for a candidate who reached the final round." },
    { label: "Hybrid Policy", prompt: "Draft a company hybrid work policy with 3 days in office." },
    { label: "POSH Reminder", prompt: "Write an urgent POSH training reminder email to overdue employees." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          AI Workforce Intelligence
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>HR Copilot</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Ask questions about your workforce data, generate HR documents, evaluate candidates, and request policy drafts.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Left Main Chat Window */}
        <div className="tp-panel" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", padding: 0, overflow: "hidden" }}>
          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "84%",
                  padding: "12px 16px",
                  borderRadius: 16,
                  background: msg.role === "user" ? "var(--ink)" : "var(--tint)",
                  color: msg.role === "user" ? "#fff" : "var(--ink)",
                  borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", padding: "12px 16px", borderRadius: 16, background: "var(--tint)", fontSize: 13, color: "var(--muted)" }}>
                HR Copilot is analyzing your data…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div style={{ padding: 12, borderTop: "1px solid var(--line)", background: "#fff" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: "flex", gap: 10 }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask HR Copilot anything about candidates, flight risks, salaries, policies…"
                style={{
                  flex: 1,
                  border: "1px solid var(--line2)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  outline: 0,
                  fontSize: 13.5,
                }}
              />
              <button type="submit" disabled={loading || !input.trim()} className="tp-btn tp-btn-ai" style={{ padding: "0 18px" }}>
                <Send style={{ width: 16, height: 16 }} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Query Shortcuts & Document Templates */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="tp-panel stack">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Suggested Questions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="tp-btn"
                  style={{ justifyContent: "flex-start", textAlign: "left", fontSize: 12, padding: "8px 10px", whiteSpace: "normal" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="tp-panel stack">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Quick HR Documents</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {documentTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(t.prompt)}
                  className="tp-btn"
                  style={{ fontSize: 11.5, padding: "8px 6px", textOverflow: "ellipsis" }}
                >
                  <FileText style={{ width: 13, height: 13 }} /> {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
