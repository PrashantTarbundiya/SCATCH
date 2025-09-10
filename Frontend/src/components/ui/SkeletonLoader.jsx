import React from 'react';

// Base skeleton component
const Skeleton = ({ className = '', width = 'w-full', height = 'h-4', rounded = 'rounded' }) => (
  <div 
    className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${width} ${height} ${rounded} ${className}`}
  />
);

// Card skeleton for product cards, coupon cards, etc.
export const CardSkeleton = ({ showImage = true, lines = 3 }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden bg-white dark:bg-gray-800 p-4">
    {showImage && (
      <Skeleton width="w-full" height="h-48" rounded="rounded-lg" className="mb-4" />
    )}
    <div className="space-y-3">
      <Skeleton width="w-3/4" height="h-6" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? 'w-1/2' : 'w-full'} 
          height="h-4" 
        />
      ))}
    </div>
  </div>
);

// Table skeleton for admin tables
export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="overflow-x-auto bg-white dark:bg-neutral-800 shadow-lg rounded-lg">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
      <thead className="bg-gray-50 dark:bg-neutral-700">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-6 py-3">
              <Skeleton width="w-20" height="h-4" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <Skeleton 
                  width={colIndex === 0 ? 'w-24' : colIndex === columns - 1 ? 'w-16' : 'w-full'} 
                  height="h-4" 
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Form skeleton for modals and forms
export const FormSkeleton = ({ fields = 6 }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton width="w-48" height="h-8" />
      <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
    </div>
    
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton width="w-32" height="h-4" className="mb-2" />
          <Skeleton width="w-full" height="h-10" rounded="rounded-md" />
        </div>
      ))}
    </div>
    
    <div className="flex justify-end gap-3">
      <Skeleton width="w-20" height="h-10" rounded="rounded-md" />
      <Skeleton width="w-28" height="h-10" rounded="rounded-md" />
    </div>
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto p-6">
    <div className="flex items-center space-x-6 mb-8">
      <Skeleton width="w-24" height="h-24" rounded="rounded-full" />
      <div className="space-y-2">
        <Skeleton width="w-48" height="h-8" />
        <Skeleton width="w-32" height="h-4" />
      </div>
    </div>
    
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Skeleton width="w-24" height="h-4" className="mb-2" />
            <Skeleton width="w-full" height="h-10" rounded="rounded-md" />
          </div>
          <div>
            <Skeleton width="w-24" height="h-4" className="mb-2" />
            <Skeleton width="w-full" height="h-10" rounded="rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Dashboard stats skeleton
export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
          <Skeleton width="w-12" height="h-4" />
        </div>
        <Skeleton width="w-20" height="h-8" className="mb-2" />
        <Skeleton width="w-24" height="h-4" />
      </div>
    ))}
  </div>
);

// Product detail skeleton
export const ProductDetailSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image skeleton */}
      <div>
        <Skeleton width="w-full" height="h-96" rounded="rounded-lg" className="mb-4" />
        <div className="flex space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="w-20" height="h-20" rounded="rounded-md" />
          ))}
        </div>
      </div>
      
      {/* Details skeleton */}
      <div className="space-y-6">
        <Skeleton width="w-3/4" height="h-10" />
        <div className="flex items-center space-x-4">
          <Skeleton width="w-24" height="h-8" />
          <Skeleton width="w-20" height="h-6" />
        </div>
        <Skeleton width="w-full" height="h-24" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="w-full" height="h-4" />
          ))}
        </div>
        <div className="flex space-x-4">
          <Skeleton width="w-32" height="h-12" rounded="rounded-md" />
          <Skeleton width="w-32" height="h-12" rounded="rounded-md" />
        </div>
      </div>
    </div>
  </div>
);

// Cart skeleton
export const CartSkeleton = () => (
  <div className="max-w-4xl mx-auto p-6">
    <Skeleton width="w-32" height="h-8" className="mb-6" />
    
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Skeleton width="w-20" height="h-20" rounded="rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-48" height="h-6" />
            <Skeleton width="w-32" height="h-4" />
          </div>
          <div className="space-y-2">
            <Skeleton width="w-20" height="h-8" />
            <Skeleton width="w-16" height="h-6" />
          </div>
        </div>
      ))}
    </div>
    
    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton width="w-20" height="h-4" />
          <Skeleton width="w-16" height="h-4" />
        </div>
        <div className="flex justify-between">
          <Skeleton width="w-24" height="h-6" />
          <Skeleton width="w-20" height="h-6" />
        </div>
      </div>
      <Skeleton width="w-full" height="h-12" rounded="rounded-md" className="mt-4" />
    </div>
  </div>
);

// Generic page skeleton
export const PageSkeleton = ({ title = true, content = 5 }) => (
  <div className="p-6">
    {title && (
      <div className="flex justify-between items-center mb-6">
        <Skeleton width="w-64" height="h-8" />
        <Skeleton width="w-32" height="h-10" rounded="rounded-md" />
      </div>
    )}
    
    <div className="space-y-4">
      {Array.from({ length: content }).map((_, i) => (
        <Skeleton key={i} width="w-full" height="h-16" rounded="rounded-lg" />
      ))}
    </div>
  </div>
);

export default Skeleton;