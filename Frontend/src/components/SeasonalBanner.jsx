import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SeasonalBanner = () => {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  // Seasonal events configuration
  const seasonalEvents = [
    {
      id: 'winter_sale',
      title: '❄️ Winter Sale',
      message: 'Up to 50% off on winter collection!',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      bgColor: 'bg-gradient-to-r from-blue-600 to-purple-600',
      textColor: 'text-white'
    },
    {
      id: 'new_year',
      title: '🎉 New Year Special',
      message: 'Start 2024 with amazing deals!',
      startDate: '2024-12-25',
      endDate: '2025-01-15',
      bgColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-white'
    },
    {
      id: 'valentine',
      title: '💝 Valentine\'s Day',
      message: 'Special gifts for your loved ones',
      startDate: '2024-02-01',
      endDate: '2024-02-14',
      bgColor: 'bg-gradient-to-r from-pink-500 to-red-500',
      textColor: 'text-white'
    }
  ];

  useEffect(() => {
    const checkActiveEvent = () => {
      const today = new Date();
      const activeEvent = seasonalEvents.find(event => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return today >= start && today <= end;
      });
      setCurrentEvent(activeEvent);
    };

    checkActiveEvent();
    const interval = setInterval(checkActiveEvent, 24 * 60 * 60 * 1000); // Check daily

    return () => clearInterval(interval);
  }, []);

  if (!currentEvent || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`${currentEvent.bgColor} ${currentEvent.textColor} py-3 px-4 relative overflow-hidden`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-2xl">{currentEvent.title.split(' ')[0]}</span>
            <div>
              <h3 className="font-bold text-lg">{currentEvent.title.substring(2)}</h3>
              <p className="text-sm opacity-90">{currentEvent.message}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition-colors">
              Shop Now
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/80 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [-100, window.innerWidth + 100] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 transform -translate-y-1/2 text-6xl opacity-10"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ x: [window.innerWidth + 100, -100] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
            className="absolute top-1/4 text-4xl opacity-10"
          >
            🎁
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SeasonalBanner;