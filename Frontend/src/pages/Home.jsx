import React from 'react';
import { HeroSection } from '../components/ui/hero-odyssey';
import SeasonalBanner from '../components/SeasonalBanner';
import CategoriesSection from '../components/CategoriesSection';
import MouseGlow from '../components/MouseGlow';

const Home = () => {
  return (
    <div className="w-full relative">
      <MouseGlow />
      <SeasonalBanner />
      <HeroSection />
      <CategoriesSection />
    </div>
  );
};

export default Home;