"use client";

import { m } from "framer-motion";

const scrollRevealVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  }
};

export default function ScrollReveal({ children, margin = "-120px" }) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      variants={scrollRevealVariants}
    >
      {children}
    </m.div>
  );
}


