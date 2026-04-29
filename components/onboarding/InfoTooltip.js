"use client";
import { useState, useRef, useEffect } from "react";

export default function InfoTooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timerRef = useRef(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        setPos({ top: r.top - 8, left: r.left + r.width / 2 });
        setVisible(true);
      }
    }, 150);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={() => setVisible((v) => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help hover:bg-gray-300 transition-colors ml-1 flex-shrink-0"
        aria-label="Info"
      >
        {children || "?"}
      </span>
      {visible && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -100%)" }}
        >
          <div className="bg-[#1a1a1a] text-white text-xs rounded-lg px-3 py-2 max-w-[200px] text-center leading-relaxed shadow-xl mb-1">
            {text}
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1a1a1a" }} />
          </div>
        </div>
      )}
    </>
  );
}
