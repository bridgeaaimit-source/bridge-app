import React from "react";

/**
 * Robust markdown formatter for AI-generated text in Team Pulse / TalentPulse.
 * Transforms **bold**, *italic*, inline code, bullets, numbered lists, and headers into clean React elements
 * so no raw asterisks or markdown syntax are shown to the user.
 */
export function renderFormattedMarkdown(
  text: string | null | undefined,
  options: {
    className?: string;
    lineHeight?: number | string;
    gap?: number;
    color?: string;
    fontSize?: number | string;
  } = {}
) {
  if (!text || typeof text !== "string") return null;

  const lines = text.split("\n");

  // Helper to parse inline **bold**, __bold__, *italic*, _italic_, and `code`
  const parseInline = (lineText: string): React.ReactNode => {
    if (!lineText) return null;

    // Matches **bold**, __bold__, `code`, *italic*, _italic_
    const regex = /(\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+?`|\*[^*]+?\*|_[^_]+?_)/g;
    const parts = lineText.split(regex);

    return parts.map((part, pIdx) => {
      if (!part) return null;

      // **Bold** or __Bold__
      if (
        (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
        (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
      ) {
        return (
          <strong key={pIdx} style={{ fontWeight: 700, color: "inherit" }}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      // `Code`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={pIdx}
            style={{
              padding: "1px 5px",
              background: "rgba(0,0,0,0.06)",
              borderRadius: 4,
              fontFamily: "var(--f-mono, monospace)",
              fontSize: "0.9em",
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // *Italic* or _Italic_
      if (
        (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
        (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
      ) {
        return <em key={pIdx}>{part.slice(1, -1)}</em>;
      }

      return part;
    });
  };

  return (
    <div
      className={options.className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: options.gap !== undefined ? options.gap : 6,
        lineHeight: options.lineHeight || 1.6,
        color: options.color || "inherit",
        fontSize: options.fontSize || "inherit",
      }}
    >
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();

        if (!line) {
          return <div key={idx} style={{ height: 4 }} />;
        }

        // Headings (###, ##, #)
        if (line.startsWith("### ")) {
          return (
            <div
              key={idx}
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--ink, #0F172A)",
                marginTop: 6,
                marginBottom: 2,
              }}
            >
              {parseInline(line.replace(/^###\s+/, ""))}
            </div>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <div
              key={idx}
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "var(--ink, #0F172A)",
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              {parseInline(line.replace(/^##\s+/, ""))}
            </div>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <div
              key={idx}
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "var(--ink, #0F172A)",
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              {parseInline(line.replace(/^#\s+/, ""))}
            </div>
          );
        }

        // Bullet points (•, -, *, ▪, ⁃, –)
        const bulletMatch = line.match(/^([•▪⁃\-\*–—])\s+(.*)$/);
        if (bulletMatch) {
          const content = bulletMatch[2];
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 7,
                paddingLeft: rawLine.startsWith("  ") || rawLine.startsWith("\t") ? 16 : 2,
              }}
            >
              <span style={{ flexShrink: 0, fontWeight: 700, userSelect: "none" }}>•</span>
              <div style={{ flex: 1 }}>{parseInline(content)}</div>
            </div>
          );
        }

        // Numbered list items (e.g. "1. ", "2. ")
        const numMatch = line.match(/^(\d+[\.\)])\s+(.*)$/);
        if (numMatch) {
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 7,
                paddingLeft: rawLine.startsWith("  ") || rawLine.startsWith("\t") ? 16 : 2,
              }}
            >
              <span style={{ flexShrink: 0, fontWeight: 700, minWidth: 16, userSelect: "none" }}>
                {numMatch[1]}
              </span>
              <div style={{ flex: 1 }}>{parseInline(numMatch[2])}</div>
            </div>
          );
        }

        // Standard text line
        return <div key={idx}>{parseInline(line)}</div>;
      })}
    </div>
  );
}
