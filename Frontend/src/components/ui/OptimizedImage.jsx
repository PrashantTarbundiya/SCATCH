import React, { useState, memo } from 'react';

const OptimizedImage = memo(({ src, alt, className, onClick, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200 dark:bg-gray-700`}>
        <span className="text-gray-400 dark:text-gray-500">No Image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <div className={`${className} animate-pulse bg-gray-200 dark:bg-gray-700`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading="lazy"
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;