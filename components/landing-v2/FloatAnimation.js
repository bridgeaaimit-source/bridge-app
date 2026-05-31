"use client";

import { m } from "framer-motion";

const floatVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 1, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  }
};

export default function FloatAnimation({ children, margin = "-100px" }) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      variants={floatVariants}
    >
      {children}
    </m.div>
  );
}


