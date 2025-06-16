import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext'; // Assuming you might want to use theme context

const ContactPage = () => {
  const { theme } = useTheme();
  // Placeholder social links - replace with your actual URLs
  const socialLinks = {
    email: 'mailto:scatchotp@gmail.com',
    instagram: 'https://www.instagram.com/prashanttarbundiya/',
    linkedin: 'https://www.linkedin.com/in/prashant-tarbundiya/',
    github: 'https://github.com/PrashantTarbundiya',
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors duration-300 py-12 pt-24 md:pt-28 px-4 md:px-6 lg:px-8`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-4xl font-bold text-center mb-12 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Contact Us
        </h1>

        {/* Contact Information Section */}
        <section className={`mb-12 p-6 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-semibold mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-700'}`}>Get in Touch</h2>
          <p className="mb-6">
            We'd love to hear from you! Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className={`text-xl font-medium mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Social Media</h3>
              <ul className="space-y-3">
                <li>
                  <a href={socialLinks.email} className={`hover:text-blue-500 dark:hover:text-blue-400 flex items-center`} target="_blank" rel="noopener noreferrer">
                    <i className="ri-mail-line mr-3 text-xl"></i> Email Us
                  </a>
                </li>
                <li>
                  <a href={socialLinks.instagram} className={`hover:text-pink-500 dark:hover:text-pink-400 flex items-center`} target="_blank" rel="noopener noreferrer">
                    <i className="ri-instagram-line mr-3 text-xl"></i> Instagram
                  </a>
                </li>
                <li>
                  <a href={socialLinks.linkedin} className={`hover:text-blue-600 dark:hover:text-blue-500 flex items-center`} target="_blank" rel="noopener noreferrer">
                    <i className="ri-linkedin-box-fill mr-3 text-xl"></i> LinkedIn
                  </a>
                </li>
                <li>
                  <a href={socialLinks.github} className={`hover:text-gray-500 dark:hover:text-gray-400 flex items-center`} target="_blank" rel="noopener noreferrer">
                    <i className="ri-github-fill mr-3 text-xl"></i> GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;