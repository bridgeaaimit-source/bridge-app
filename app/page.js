import AnimatedBackground from "@/components/landing-v2/AnimatedBackground";
import Navbar from "@/components/landing-v2/Navbar";
import Hero from "@/components/landing-v2/Hero";
import SocialProof from "@/components/landing-v2/SocialProof";
import BridgeScoreSection from "@/components/landing-v2/BridgeScoreSection";
import CategoryPositioning from "@/components/landing-v2/CategoryPositioning";
import JourneySection from "@/components/landing-v2/JourneySection";
import ScrollReveal from "@/components/landing-v2/ScrollReveal";
import FloatAnimation from "@/components/landing-v2/FloatAnimation";
import dynamic from "next/dynamic";

const EcosystemSection = dynamic(() => import("@/components/landing-v2/EcosystemSection"), { ssr: false });
const EmployerVisibilitySection = dynamic(() => import("@/components/landing-v2/EmployerVisibilitySection"), { ssr: false });
const TestimonialsSection = dynamic(() => import("@/components/landing-v2/TestimonialsSection"), { ssr: false });
const PricingSection = dynamic(() => import("@/components/landing-v2/PricingSection"), { ssr: false });
const FooterCTA = dynamic(() => import("@/components/landing-v2/FooterCTA"), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen relative landing-theme">
      <AnimatedBackground />

      {/* Navbar overlay */}
      <Navbar />

      {/* Main content flow */}
      <main className="relative z-10">
        <Hero />
        
        <ScrollReveal margin="-120px">
          <SocialProof />
        </ScrollReveal>

        <ScrollReveal margin="-120px">
          <CategoryPositioning />
        </ScrollReveal>

        <FloatAnimation margin="-100px">
          <BridgeScoreSection />
        </FloatAnimation>

        <ScrollReveal margin="-120px">
          <EcosystemSection />
        </ScrollReveal>

        <ScrollReveal margin="-120px">
          <EmployerVisibilitySection />
        </ScrollReveal>

        {/* Cinematic Career Evolution Journey */}
        <JourneySection />

        <ScrollReveal margin="-120px">
          <TestimonialsSection />
        </ScrollReveal>

        <ScrollReveal margin="-120px">
          <PricingSection />
        </ScrollReveal>

        <FooterCTA />
      </main>
    </div>
  );
}
