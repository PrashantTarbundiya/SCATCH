import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="m-b-2 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 py-6 text-center">
      <div className="container mx-auto">
        <p>&copy; {currentYear} Scatch</p> 
      </div>
    </footer>
  );
};

export default Footer;