import React from 'react';
import { HeroSection } from '../components/ui/hero-odyssey';
import SeasonalBanner from '../components/SeasonalBanner';
import CategoriesSection from '../components/CategoriesSection';
import FeaturedProducts from '../components/FeaturedProducts';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="w-full">
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







