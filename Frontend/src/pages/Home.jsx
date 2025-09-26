import React from 'react';
import { HeroSection } from '../components/ui/hero-odyssey';
import SeasonalBanner from '../components/SeasonalBanner';

const Home = () => {
  return (
    <div className="w-full h-screen">
      <SeasonalBanner />
      <HeroSection />
    </div>
  );
};

export default Home;