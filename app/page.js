import AnimatedBackground from "@/components/landing-v2/AnimatedBackground";
import Navbar from "@/components/landing-v2/Navbar";
import Hero from "@/components/landing-v2/Hero";
import SocialProof from "@/components/landing-v2/SocialProof";
import ReadinessStack from "@/components/landing-v2/ReadinessStack";
import BridgeScoreSection from "@/components/landing-v2/BridgeScoreSection";
import ScrollReveal from "@/components/landing-v2/ScrollReveal";
import FloatAnimation from "@/components/landing-v2/FloatAnimation";
import dynamic from "next/dynamic";

const EcosystemSection = dynamic(() => import("@/components/landing-v2/EcosystemSection"));
const GDShowcase = dynamic(() => import("@/components/landing-v2/GDShowcase"));
const AudienceSegmentation = dynamic(() => import("@/components/landing-v2/AudienceSegmentation"));
const ProductDemo = dynamic(() => import("@/components/landing-v2/ProductDemo"));
const PricingPreview = dynamic(() => import("@/components/landing-v2/PricingPreview"));
const TrustSection = dynamic(() => import("@/components/landing-v2/TrustSection"));
const FooterCTA = dynamic(() => import("@/components/landing-v2/FooterCTA"));

export default function Home() {
  return (
    <div className="min-h-screen relative landing-theme">
      <AnimatedBackground />

      {/* Sticky Global Navigation */}
      <Navbar />

      {/* Main Content Flow */}
      <main className="relative z-10">
        <Hero />
        
        <ScrollReveal margin="-120px">
          <SocialProof />
        </ScrollReveal>

        {/* 3. Placement Readiness Stack */}
        <ScrollReveal margin="-120px">
          <ReadinessStack />
        </ScrollReveal>

        {/* 4. Bridge Score Section */}
        <FloatAnimation margin="-100px">
          <BridgeScoreSection />
        </FloatAnimation>

        {/* 5. AI Interview Showcase (EcosystemSection Feature Block 1 & Platform Features) */}
        <ScrollReveal margin="-120px">
          <EcosystemSection />
        </ScrollReveal>

        {/* 6. AI GD Showcase */}
        <ScrollReveal margin="-120px">
          <GDShowcase />
        </ScrollReveal>

        {/* 7. Who is BridgeAI For? (Audience Segmentation) */}
        <ScrollReveal margin="-120px">
          <AudienceSegmentation />
        </ScrollReveal>

        {/* 8. Product Demo Section */}
        <ScrollReveal margin="-120px">
          <ProductDemo />
        </ScrollReveal>

        {/* 9. Pricing Preview Section */}
        <ScrollReveal margin="-120px">
          <PricingPreview />
        </ScrollReveal>

        {/* 10. Trust & Credibility Section */}
        <ScrollReveal margin="-120px">
          <TrustSection />
        </ScrollReveal>

        {/* Footer & Address Block */}
        <FooterCTA />
      </main>
    </div>
  );
}
