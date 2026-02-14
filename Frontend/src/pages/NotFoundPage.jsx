import React from 'react';


const NotFoundPage = () => {
  return (
    <div className="w-full min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center px-4 py-12 bg-white pt-24">
      <div className="border-4 border-black p-8 shadow-neo bg-yellow-300 max-w-md w-full relative">
        <h1 className="text-9xl font-black text-black mb-2 flex justify-center items-center gap-2">
          4<span className="text-white text-shadow-neo">0</span>4
        </h1>
        <h2 className="text-3xl font-black uppercase mb-6 bg-black text-white p-2">Page Not Found</h2>
        <p className="text-xl font-bold text-gray-800 uppercase mb-8">
          The page you are looking for has been moved or deleted.
        </p>
        <a href="/" className="inline-block px-8 py-4 bg-blue-600 text-white font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          Return Home
        </a>
      </div>
    </div>
  );
};

export default NotFoundPage;







