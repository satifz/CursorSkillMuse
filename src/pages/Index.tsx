import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/landing/Features";
import Vision2030 from "@/components/landing/Vision2030";
import PricingTeaser from "@/components/landing/PricingTeaser";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <HowItWorks />
      <Features />
      <Vision2030 />
      <PricingTeaser />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
};

export default Index;