import React from 'react';
import { HeroSection } from '../components/ui/hero-odyssey';
import SEO from '../components/SEO';
import SeasonalBanner from '../components/SeasonalBanner';
import CategoriesSection from '../components/CategoriesSection';
import FeaturedProducts from '../components/FeaturedProducts';
import Testimonials from '../components/Testimonials';
import { Footer } from '../components/ui/footer-section';

const Home = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Scatch",
    "url": "https://scatch-neo.vercel.app",
    "logo": "https://scatch-neo.vercel.app/logo2.png",
    "sameAs": [
      "https://x.com/prashant130406",
      "http://instagram.com/prashanttarbundiya/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-7984104910",
      "contactType": "Customer Support"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Scatch",
    "url": "https://scatch-neo.vercel.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://scatch-neo.vercel.app/shop?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="w-full">
      <SEO
        title="Home"
        description="Welcome to Scatch. The ultimate destination for premium urban fashion, streetwear, and exclusive drops."
        schema={[organizationSchema, websiteSchema]}
      />
      <SeasonalBanner />
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Home;







