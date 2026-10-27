import TopBar from "@/components/landing/top-bar";
import SiteHeader, { LandingBottomNav } from "@/components/landing/site-header";
import HeroSection from "@/components/landing/hero-section";
import WelcomeSection from "@/components/landing/welcome-section";
import StorySection from "@/components/landing/story-section";
import ParallaxBand from "@/components/landing/parallax-band";
import OfferSection from "@/components/landing/offer-section";
import SplitSections from "@/components/landing/split-sections";
import OutcomesSection from "@/components/landing/outcomes-section";
import MarketplaceSection from "@/components/landing/marketplace-section";
import FarmersSection from "@/components/landing/farmers-section";
import TestimonialSection from "@/components/landing/testimonial-section";
import BlogsSection from "@/components/landing/blogs-section";
import Footer from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="pb-20 md:pb-0">
      <TopBar />
      <SiteHeader />
      <main>
        <HeroSection />
        <WelcomeSection />
        <StorySection />
        <ParallaxBand />
        <OfferSection />
        <SplitSections />
        <OutcomesSection />
        <MarketplaceSection />
        <FarmersSection />
        <TestimonialSection />
        <BlogsSection />
      </main>
      <Footer />
      <LandingBottomNav />
    </div>
  );
}