import React, { useState } from 'react';
// Assuming you might want to use theme context

const ContactPage = () => {

  // Placeholder social links - replace with your actual URLs
  const socialLinks = [
    { name: 'Email Us', url: 'mailto:scatchotp@gmail.com', icon: 'ri-mail-line', color: 'bg-red-400' },
    { name: 'Instagram', url: 'https://www.instagram.com/prashanttarbundiya/', icon: 'ri-instagram-line', color: 'bg-pink-400' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/prashant-tarbundiya/', icon: 'ri-linkedin-box-fill', color: 'bg-blue-400' },
    { name: 'GitHub', url: 'https://github.com/PrashantTarbundiya', icon: 'ri-github-fill', color: 'bg-gray-800 text-white' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-7xl font-black text-center mb-10 md:mb-16 uppercase tracking-tighter">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Info Card */}
          <div className="border-4 border-black p-6 md:p-8 bg-white shadow-neo transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <h2 className="text-2xl md:text-3xl font-black uppercase mb-6">Get in Touch</h2>
            <p className="mb-6 text-base md:text-lg font-bold text-gray-700 leading-relaxed">
              We'd love to hear from you! Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
            </p>
            <div className="w-full h-4 bg-black mb-6"></div>
            <p className="font-bold uppercase text-sm flex items-center">
              <i className="ri-map-pin-line mr-2 text-xl"></i> Ahmedabad, Gujarat, India
            </p>
          </div>

          {/* Social Links Grid */}
          <div className="grid grid-cols-1 gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-4 md:p-6 border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all bg-white group`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-4">
                    <span className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border-2 border-black ${link.color || 'bg-gray-200'} text-xl md:text-2xl`}>
                      <i className={`${link.icon} ${link.name === 'GitHub' ? 'text-white' : 'text-black'}`}></i>
                    </span>
                    <span className="text-lg md:text-xl font-black uppercase">{link.name}</span>
                  </span>
                  <i className="ri-arrow-right-up-line text-xl md:text-2xl opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;







