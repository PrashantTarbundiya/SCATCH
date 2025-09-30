import React from 'react';
import { HeroSection } from '../components/ui/hero-odyssey';
import SeasonalBanner from '../components/SeasonalBanner';
import CategoriesSection from '../components/CategoriesSection';

const Home = () => {
  return (
    <div className="w-full">
      <SeasonalBanner />
      <HeroSection />
      <CategoriesSection />
    </div>
  );
};

export default Home;