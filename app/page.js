"use client";

import { motion } from "framer-motion";
import AnimatedBackground from "@/components/landing-v2/AnimatedBackground";
import Navbar from "@/components/landing-v2/Navbar";
import Hero from "@/components/landing-v2/Hero";
import SocialProof from "@/components/landing-v2/SocialProof";
import BridgeScoreSection from "@/components/landing-v2/BridgeScoreSection";
import EcosystemSection from "@/components/landing-v2/EcosystemSection";
import EmployerVisibilitySection from "@/components/landing-v2/EmployerVisibilitySection";
import JourneySection from "@/components/landing-v2/JourneySection";
import TestimonialsSection from "@/components/landing-v2/TestimonialsSection";
import CategoryPositioning from "@/components/landing-v2/CategoryPositioning";
import PricingSection from "@/components/landing-v2/PricingSection";
import FooterCTA from "@/components/landing-v2/FooterCTA";
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

export default function Home() {
  return (
    <div className="min-h-screen relative landing-theme">
      <AnimatedBackground />

      {/* Navbar overlay */}
      <Navbar />

      {/* Main content flow */}
      <main className="relative z-10">
        <Hero />
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <SocialProof />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <CategoryPositioning />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={floatVariants}
        >
          <BridgeScoreSection />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <EcosystemSection />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <EmployerVisibilitySection />
        </motion.div>

        {/* Cinematic Career Evolution Journey */}
        <JourneySection />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <TestimonialsSection />
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={scrollRevealVariants}
        >
          <PricingSection />
        </motion.div>

        <FooterCTA />
      </main>
    </div>
  );
}
