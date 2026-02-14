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
      textColor: 'text-gray-900 dark:text-white'
    },
    {
      id: 'new_year',
      title: '🎉 New Year Special',
      message: 'Start 2024 with amazing deals!',
      startDate: '2024-12-25',
      endDate: '2025-01-15',
      bgColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      textColor: 'text-gray-900 dark:text-white'
    },
    {
      id: 'valentine',
      title: '💝 Valentine\'s Day',
      message: 'Special gifts for your loved ones',
      startDate: '2024-02-01',
      endDate: '2024-02-14',
      bgColor: 'bg-gradient-to-r from-pink-500 to-red-500',
      textColor: 'text-gray-900 dark:text-white'
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
        className="bg-accent text-accent-foreground py-3 px-4 relative overflow-hidden border-b-2 border-black"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-2xl border-2 border-black bg-white p-1 shadow-neo-sm">{currentEvent.title.split(' ')[0]}</span>
            <div>
              <h3 className="font-black text-lg uppercase tracking-wide">{currentEvent.title.substring(2)}</h3>
              <p className="text-sm font-bold">{currentEvent.message}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="bg-white text-black border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] px-6 py-2 rounded-none text-sm font-bold uppercase transition-all">
              Shop Now
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-accent-foreground hover:bg-black/10 w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-black transition-all"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SeasonalBanner;




