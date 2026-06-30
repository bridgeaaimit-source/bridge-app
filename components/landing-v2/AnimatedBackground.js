"use client";

import { m, useScroll, useTransform  } from "framer-motion";

export default function AnimatedBackground() {
  const { scrollY } = useScroll();
  const gridY = useTransform(scrollY, [0, 2000], [0, -200]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#F8FAFC] dark:bg-[#030908] overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 opacity-100 transition-opacity duration-500">
      
      {/* Base Static Grid (with parallax) */}
      <m.div 
        style={{ y: gridY }}
        className="absolute inset-[-200px] opacity-5 dark:opacity-10" 
      >
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#2DD4BF 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </m.div>

      {/* Sweep & Scan Light Beams */}
      <m.div
        className="absolute top-0 bottom-0 w-[500px] bg-gradient-to-r from-transparent via-[#0D9488]/5 dark:via-[#0D9488]/10 to-transparent skew-x-12"
        animate={{ left: ["-50%", "150%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <m.div
        className="absolute top-0 bottom-0 w-[800px] bg-gradient-to-r from-transparent via-[#14B8A6]/3 dark:via-[#14B8A6]/5 to-transparent -skew-x-12"
        animate={{ right: ["-50%", "150%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
      />



      {/* Dynamic Aurora Gradient Background Loop */}
      <m.div 
        className="absolute top-[10%] -left-[10%] h-[60vw] w-[60vw] max-h-[800px] max-w-[800px] rounded-full bg-[#0D9488]/15 dark:bg-[#0D9488]/30 blur-[120px] pointer-events-none" 
        animate={{
          x: ["0%", "20%", "0%"],
          y: ["0%", "10%", "0%"],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <m.div 
        className="absolute top-[40%] right-[0%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-[#14B8A6]/10 dark:bg-[#14B8A6]/20 blur-[100px] pointer-events-none" 
        animate={{
          x: ["0%", "-30%", "0%"],
          y: ["0%", "-20%", "0%"],
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <m.div 
        className="absolute bottom-[10%] left-[20%] h-[70vw] w-[70vw] max-h-[900px] max-w-[900px] rounded-full bg-[#047857]/10 dark:bg-[#047857]/15 blur-[150px] pointer-events-none" 
        animate={{
          x: ["0%", "25%", "0%"],
          y: ["0%", "-30%", "0%"],
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.6, 0.2]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      </div>
    </div>
  );
}



