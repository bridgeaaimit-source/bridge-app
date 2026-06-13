import { useState, useEffect, useRef } from "react";

export function useScreenLock({ isActive, onTerminate, maxViolations = 3 }) {
  const [violations, setViolations] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReason, setWarningReason] = useState("");
  const isTerminatedRef = useRef(false);

  const onTerminateRef = useRef(onTerminate);
  // eslint-disable-next-line react-hooks/refs
  onTerminateRef.current = onTerminate;

  const isActiveRef = useRef(isActive);
  // eslint-disable-next-line react-hooks/refs
  isActiveRef.current = isActive;

  const requestFullscreen = () => {
    if (typeof window === "undefined") return;
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request rejected:", err);
        });
      }
    } catch (e) {
      console.warn("Fullscreen error:", e);
    }
  };

  const exitFullscreen = () => {
    if (typeof window === "undefined") return;
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn("Exit fullscreen failed:", err);
        });
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const resetWarning = () => {
    setShowWarningModal(false);
    requestFullscreen();
  };

  useEffect(() => {
    if (!isActive) {
      exitFullscreen();
      setViolations(0);
      setShowWarningModal(false);
      isTerminatedRef.current = false;
      return;
    }

    requestFullscreen();

    let lastViolationTime = 0;

    const handleViolation = (reason) => {
      if (isTerminatedRef.current || !isActiveRef.current) return;

      const now = Date.now();
      if (now - lastViolationTime < 1500) return;
      lastViolationTime = now;

      setViolations((prev) => {
        const next = prev + 1;
        if (next >= maxViolations) {
          isTerminatedRef.current = true;
          exitFullscreen();
          onTerminateRef.current?.("Too many violations: " + reason);
          return next;
        }
        setWarningReason(reason);
        setShowWarningModal(true);
        return next;
      });
    };

    const handleVisibility = () => {
      if (document.hidden && isActiveRef.current) {
        handleViolation("tab_switch");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActiveRef.current && !isTerminatedRef.current) {
        handleViolation("fullscreen_exit");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isActive, maxViolations]);

  return {
    violations,
    showWarningModal,
    warningReason,
    resetWarning,
    requestFullscreen,
    exitFullscreen,
    maxViolations,
  };
}
