import React from 'react';
import { useTheme } from '../context/ThemeContext';

const NotFoundPage = () => {
  const { theme } = useTheme();

  return (
    <div className={`w-full min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center px-4 py-12 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900 dark:text-purple-100'} transition-colors duration-300 pt-28`} >
      <h1 className="text-6xl md:text-9xl font-bold text-blue-500 dark:text-blue-400 mb-4">404</h1>
      <h2 className="text-2xl md:text-4xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-lg md:text-xl text-gray-600 dark:text-purple-300">
        Oops! The page you're looking for doesn't seem to exist.
      </p>
    </div>
  );
};

export default NotFoundPage;







