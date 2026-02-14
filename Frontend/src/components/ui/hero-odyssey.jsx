import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import logo2 from '../../assets/logo2.png';

const Marquee = ({ text, direction = 1 }) => {
  return (
    <div className="flex overflow-hidden whitespace-nowrap border-y-4 border-black bg-yellow-300 py-3">
      <motion.div
        initial={{ x: direction > 0 ? -1000 : 0 }}
        animate={{ x: direction > 0 ? 0 : -1000 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 20
        }}
        className="flex gap-8 items-center"
      >
        {Array(20).fill(text).map((item, i) => (
          <span key={i} className="text-2xl font-black uppercase text-black tracking-widest flex items-center gap-4">
            {item} <i className="ri-star-fill text-xl"></i>
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full min-h-[95vh] bg-[#f0f0f0] text-black overflow-hidden flex flex-col border-b-4 border-black">

      {/* Dynamic Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: `${mousePosition.x * 0.05}px ${mousePosition.y * 0.05}px`
        }}
      />

      {/* Decorative shapes */}
      <motion.div
        className="absolute top-20 right-[10%] w-32 h-32 bg-purple-500 border-4 border-black shadow-neo z-10 hidden md:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute bottom-40 left-[5%] w-24 h-24 bg-blue-500 border-4 border-black rounded-full z-10 hidden md:block" />

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">

        {/* Floating "New Drop" Sticker */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: -15 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
          className="absolute top-[15%] left-[10%] md:left-[20%] bg-red-500 text-white p-4 border-4 border-black shadow-neo transform -rotate-12 z-20 hidden sm:block"
        >
          <p className="font-black uppercase text-xl text-center leading-none">
            New<br />Drop<br />2026
          </p>
        </motion.div>

        {/* Hero Text */}
        <div className="relative text-center mb-12">
          <motion.h1
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-7xl sm:text-8xl md:text-[10rem] font-black uppercase leading-[0.85] tracking-tighter mix-blend-hard-light relative z-20"
            style={{ textShadow: '6px 6px 0px rgba(0,0,0,0.2)' }}
          >
            SCATCH
          </motion.h1>

          {/* Outline Text Layer behind */}
          <h1
            className="text-7xl sm:text-8xl md:text-[10rem] font-black uppercase leading-[0.85] tracking-tighter absolute top-0 left-0 w-full h-full text-transparent z-10 select-none pointer-events-none"
            style={{ WebkitTextStroke: '2px black', transform: 'translate(8px, 8px)' }}
          >
            SCATCH
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-6 relative z-20"
        >
          <div className="bg-white border-4 border-black p-4 shadow-neo max-w-2xl transform rotate-1">
            <p className="text-lg md:text-2xl font-bold uppercase text-center leading-tight">
              Redefining street fashion with <span className="bg-yellow-300 px-1 border border-black">unapologetic</span> style.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mt-8">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)', translate: '6px 6px' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/shop'}
              className="px-8 py-4 bg-black text-white text-xl font-black uppercase border-4 border-transparent hover:border-black shadow-neo tracking-wider transition-all"
            >
              Start Shopping <i className="ri-arrow-right-line ml-2"></i>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)', translate: '6px 6px', background: '#ffe4e6' }} // rose-100
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '#categories'}
              className="px-8 py-4 bg-white text-black text-xl font-black uppercase border-4 border-black shadow-neo tracking-wider transition-all"
            >
              Explore Categories
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Hero Image / Graphic (Logo) */}
      <motion.div
        style={{ y: y2 }}
        className="absolute right-[-10%] bottom-[-10%] w-[40vh] h-[40vh] md:w-[60vh] md:h-[60vh] opacity-10 pointer-events-none z-0"
      >
        <img src={logo2} alt="Scatch Logo" className="w-full h-full object-contain grayscale contrast-150" />
      </motion.div>

      {/* Marquee Footer of Hero */}
      <div className="mt-auto z-20 relative">
        <Marquee text="PREMIUM QUALITY • STREETWEAR • LIMITED EDITION •" direction={1} />
      </div>
    </div>
  );
};




