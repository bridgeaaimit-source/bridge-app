"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function AnimatedBackground() {
  const { scrollY } = useScroll();
  const gridY = useTransform(scrollY, [0, 2000], [0, -200]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-[#F8FAFC] dark:bg-[#030908] overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 opacity-100 transition-opacity duration-500">
      
      {/* Base Static Grid (with parallax) */}
      <motion.div 
        style={{ y: gridY }}
        className="absolute inset-[-200px] opacity-5 dark:opacity-10" 
      >
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#2DD4BF 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </motion.div>

      {/* Sweep & Scan Light Beams */}
      <motion.div
        className="absolute top-0 bottom-0 w-[500px] bg-gradient-to-r from-transparent via-[#0D9488]/5 dark:via-[#0D9488]/10 to-transparent skew-x-12"
        animate={{ left: ["-50%", "150%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-0 bottom-0 w-[800px] bg-gradient-to-r from-transparent via-[#14B8A6]/3 dark:via-[#14B8A6]/5 to-transparent -skew-x-12"
        animate={{ right: ["-50%", "150%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
      />

      {/* Animated Grid Trains (Tracers) */}
      <motion.div 
        className="absolute top-[20%] h-[1px] w-[300px] bg-gradient-to-r from-transparent via-[#2DD4BF]/40 to-[#0D9488] dark:to-[#2DD4BF]"
        style={{ filter: "drop-shadow(0 0 6px rgba(13,148,136,0.6))" }}
        animate={{ left: ["-20%", "120%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute bottom-[30%] h-[1px] w-[400px] bg-gradient-to-l from-transparent via-[#10B981]/40 to-[#059669] dark:to-[#10B981]"
        style={{ filter: "drop-shadow(0 0 6px rgba(5,150,105,0.6))" }}
        animate={{ right: ["-20%", "120%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
      />
      <motion.div 
        className="absolute left-[15%] w-[1px] h-[300px] bg-gradient-to-b from-transparent via-[#2DD4BF]/40 to-[#0D9488] dark:to-[#2DD4BF]"
        style={{ filter: "drop-shadow(0 0 6px rgba(13,148,136,0.6))" }}
        animate={{ top: ["-20%", "120%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: 1 }}
      />
      <motion.div 
        className="absolute right-[25%] w-[1px] h-[400px] bg-gradient-to-t from-transparent via-[#10B981]/40 to-[#059669] dark:to-[#10B981]"
        style={{ filter: "drop-shadow(0 0 6px rgba(5,150,105,0.6))" }}
        animate={{ bottom: ["-20%", "120%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 4 }}
      />

      {/* Dynamic Aurora Gradient Background Loop */}
      <motion.div 
        className="absolute top-[10%] -left-[10%] h-[60vw] w-[60vw] max-h-[800px] max-w-[800px] rounded-full bg-[#0D9488]/15 dark:bg-[#0D9488]/30 blur-[120px] pointer-events-none" 
        animate={{
          x: ["0%", "20%", "0%"],
          y: ["0%", "10%", "0%"],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-[40%] right-[0%] h-[50vw] w-[50vw] max-h-[600px] max-w-[600px] rounded-full bg-[#14B8A6]/10 dark:bg-[#14B8A6]/20 blur-[100px] pointer-events-none" 
        animate={{
          x: ["0%", "-30%", "0%"],
          y: ["0%", "-20%", "0%"],
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div 
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
