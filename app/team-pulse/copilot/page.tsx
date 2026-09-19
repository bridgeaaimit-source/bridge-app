"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Send, Sparkles, FileText, User, HelpCircle, FileCheck, CheckCircle2 } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function HRCopilotContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your **HR Copilot**. I have full context across all **64 employees**, **8 open roles**, **32 candidates**, performance ratings, sentiment scores, and compliance records.\n\nAsk me anything about hiring, flight risk, promotions, or pick a suggested question or quick document template on the right.",
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
    "Who are my top 3 candidates for Senior Data Analyst, and what should I offer the best one?",
    "Who is most likely to leave in the next 6 months and why?",
    "Who is ready for promotion this cycle?",
    "Who should be on a PIP, and what should I check first?",
    "Which employees are overdue on POSH training?",
    "Which team is least happy right now?",
  ];

  const documentTemplates = [
    { label: "Offer letter", prompt: "Draft an offer letter for Sneha Kulkarni for Senior Data Analyst." },
    { label: "Rejection email", prompt: "Write a kind rejection email for a candidate who reached the final round." },
    { label: "Hybrid policy", prompt: "Draft a hybrid work policy for our company." },
    { label: "POSH reminder", prompt: "Write a POSH training reminder to overdue employees." },
    { label: "Appraisal letter", prompt: "Draft an appraisal letter for Arjun Nair with a rating of 5." },
    { label: "Warning letter", prompt: "Draft a first written warning letter for repeated unexplained absence, respectful and compliant with Indian labour norms." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          AI Workforce Intelligence
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>HR Copilot</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Ask anything about your people data, or generate letters, emails, and policies in one click.
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Left Chat Main Window */}
        <div className="tp-panel" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", minHeight: 520, padding: 0, overflow: "hidden" }}>
          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 12,
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: msg.role === "user" ? "var(--ink)" : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: msg.role === "assistant" ? "0 2px 6px rgba(99, 102, 241, 0.3)" : "none",
                  }}
                >
                  {msg.role === "user" ? <User style={{ width: 16, height: 16 }} /> : <Sparkles style={{ width: 16, height: 16 }} />}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "12px 16px",
                    borderRadius: 16,
                    background: msg.role === "user" ? "var(--ink)" : "#f8fafc",
                    color: msg.role === "user" ? "#fff" : "var(--ink)",
                    border: msg.role === "assistant" ? "1px solid var(--line)" : "none",
                    borderTopRightRadius: msg.role === "user" ? 4 : 16,
                    borderTopLeftRadius: msg.role === "assistant" ? 4 : 16,
                    fontSize: 13.5,
                    boxShadow: msg.role === "user" ? "0 2px 8px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  {renderFormattedMarkdown(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <Sparkles style={{ width: 16, height: 16 }} />
                </div>
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: 16,
                    background: "#f8fafc",
                    border: "1px solid var(--line)",
                    fontSize: 13,
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span className="tp-pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }}></span>
                  HR Copilot is analyzing workforce data…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div style={{ padding: 14, borderTop: "1px solid var(--line)", background: "#fff" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: "flex", gap: 10, alignItems: "center" }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about hiring, attrition, promotions, compliance…"
                style={{
                  flex: 1,
                  border: "1px solid var(--line2)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  outline: 0,
                  fontSize: 14,
                  background: "#fafafa",
                  transition: "border-color 0.2s",
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="tp-btn tp-btn-ai"
                style={{
                  padding: "0 20px",
                  height: 44,
                  borderRadius: 12,
                  opacity: loading || !input.trim() ? 0.6 : 1,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                }}
              >
                <Send style={{ width: 16, height: 16 }} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel Shortcuts & Templates */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Try Asking Panel */}
          <div className="tp-panel stack" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <HelpCircle style={{ width: 16, height: 16, color: "var(--indigo-ink)" }} />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Try asking</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="tp-btn"
                  style={{
                    justifyContent: "flex-start",
                    textAlign: "left",
                    fontSize: 12.5,
                    padding: "9px 12px",
                    whiteSpace: "normal",
                    lineHeight: 1.4,
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    transition: "all 0.15s ease",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Documents Panel */}
          <div className="tp-panel stack" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <FileCheck style={{ width: 16, height: 16, color: "var(--indigo-ink)" }} />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Quick documents</h3>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {documentTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(t.prompt)}
                  className="tp-btn"
                  style={{
                    fontSize: 12,
                    padding: "7px 12px",
                    borderRadius: 20,
                    background: "var(--tint)",
                    border: "1px solid var(--line2)",
                    color: "var(--ink)",
                    fontWeight: 600,
                  }}
                >
                  <FileText style={{ width: 13, height: 13, color: "var(--indigo-ink)" }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Banner Note */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              fontSize: 12,
              color: "var(--ink)",
              lineHeight: 1.5,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <Sparkles style={{ width: 16, height: 16, color: "#6366f1", flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Live Workforce AI:</strong> Answers are dynamically synthesized from your organization's hiring pipeline, flight risk indicators, performance appraisals, and compliance registers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HRCopilotPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, fontSize: 14 }}>Loading HR Copilot…</div>}>
      <HRCopilotContent />
    </Suspense>
  );
}
