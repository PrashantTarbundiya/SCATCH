import { useEffect, useState } from 'react';

const MouseGlow = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [glowColor, setGlowColor] = useState('rgba(59, 130, 246, 0.5)'); // Default blue

  useEffect(() => {
    // Generate random color
    const colors = [
      'rgba(59, 130, 246, 0.5)',   // Blue
      'rgba(147, 51, 234, 0.5)',   // Purple
      'rgba(236, 72, 153, 0.5)',   // Pink
      'rgba(14, 165, 233, 0.5)',   // Cyan
      'rgba(168, 85, 247, 0.5)',   // Violet
      'rgba(249, 115, 22, 0.5)',   // Orange
      'rgba(34, 197, 94, 0.5)',    // Green
      'rgba(239, 68, 68, 0.5)',    // Red
    ];

    // Set random color on mount
    setGlowColor(colors[Math.floor(Math.random() * colors.length)]);

    // Change color every 3 seconds
    const colorInterval = setInterval(() => {
      setGlowColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 3000);

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(colorInterval);
    };
  }, []);

  return (
    <>
      {/* Main glow */}
      <div
        className="pointer-events-none fixed z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
          filter: 'blur(40px)',
          transition: 'background 0.3s ease-out',
        }}
      />
      
      {/* Secondary smaller glow for more depth */}
      <div
        className="pointer-events-none fixed z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${glowColor.replace('0.5', '0.7')}, transparent 60%)`,
          filter: 'blur(20px)',
          transition: 'background 0.3s ease-out',
        }}
      />
    </>
  );
};

export default MouseGlow;