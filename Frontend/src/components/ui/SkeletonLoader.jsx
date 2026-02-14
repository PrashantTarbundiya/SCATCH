import React from 'react';

// Base skeleton component
const Skeleton = ({ className = '', width = 'w-full', height = 'h-4', rounded = '' }) => (
  <div
    className={`bg-gray-200 animate-pulse ${width} ${height} ${rounded} ${className}`}
  />
);

// Card skeleton for product cards, coupon cards, etc.
export const CardSkeleton = ({ showImage = true, lines = 3 }) => (
  <div className="border-2 border-black shadow-neo bg-white p-4">
    {showImage && (
      <Skeleton width="w-full" height="h-48" className="mb-4 border-b-2 border-black" />
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
  <div className="overflow-x-auto bg-white border-2 border-black shadow-neo">
    <table className="min-w-full divide-y-2 divide-black">
      <thead className="bg-gray-100">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-6 py-3 border-r-2 border-black last:border-r-0">
              <Skeleton width="w-20" height="h-4" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y-2 divide-black">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4 border-r-2 border-black last:border-r-0">
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
    <div className="flex justify-between items-center border-b-2 border-black pb-4">
      <Skeleton width="w-48" height="h-8" />
      <Skeleton width="w-8" height="h-8" />
    </div>

    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton width="w-32" height="h-4" className="mb-2" />
          <Skeleton width="w-full" height="h-12" className="border-2 border-gray-200" />
        </div>
      ))}
    </div>

    <div className="flex justify-end gap-3 pt-4 border-t-2 border-black">
      <Skeleton width="w-24" height="h-12" />
      <Skeleton width="w-32" height="h-12" />
    </div>
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="max-w-2xl mx-auto p-6 border-2 border-black shadow-neo bg-white">
    <div className="flex items-center space-x-6 mb-8 border-b-2 border-black pb-6">
      <Skeleton width="w-24" height="h-24" className="border-2 border-black" />
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
            <Skeleton width="w-full" height="h-10" className="border-2 border-gray-200" />
          </div>
          <div>
            <Skeleton width="w-24" height="h-4" className="mb-2" />
            <Skeleton width="w-full" height="h-10" className="border-2 border-gray-200" />
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
      <div key={i} className="p-6 bg-white border-2 border-black shadow-neo">
        <div className="flex items-center justify-between mb-4">
          <Skeleton width="w-10" height="h-10" />
          <Skeleton width="w-16" height="h-4" />
        </div>
        <Skeleton width="w-24" height="h-8" className="mb-2" />
        <Skeleton width="w-32" height="h-4" />
      </div>
    ))}
  </div>
);

// Product detail skeleton
export const ProductDetailSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image skeleton */}
      <div className="border-2 border-black shadow-neo p-4 bg-white">
        <Skeleton width="w-full" height="h-96" className="mb-4 border-2 border-gray-100" />
        <div className="flex space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="w-24" height="h-24" className="border-2 border-gray-100" />
          ))}
        </div>
      </div>

      {/* Details skeleton */}
      <div className="space-y-6 p-6 border-2 border-black shadow-neo bg-white h-fit">
        <Skeleton width="w-3/4" height="h-10" />
        <div className="flex items-center space-x-4 border-b-2 border-black pb-4">
          <Skeleton width="w-24" height="h-8" />
          <Skeleton width="w-20" height="h-6" />
        </div>
        <Skeleton width="w-full" height="h-32" />
        <div className="space-y-3 border-y-2 border-black py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="w-full" height="h-4" />
          ))}
        </div>
        <div className="flex space-x-4 pt-2">
          <Skeleton width="w-40" height="h-14" />
          <Skeleton width="w-40" height="h-14" />
        </div>
      </div>
    </div>
  </div>
);

// Cart skeleton
export const CartSkeleton = () => (
  <div className="max-w-4xl mx-auto p-6">
    <Skeleton width="w-48" height="h-10" className="mb-6" />

    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border-2 border-black shadow-neo bg-white">
          <Skeleton width="w-24" height="h-24" className="border-2 border-gray-100" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-48" height="h-6" />
            <Skeleton width="w-32" height="h-4" />
          </div>
          <div className="space-y-2">
            <Skeleton width="w-24" height="h-8" />
            <Skeleton width="w-16" height="h-6" />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-8 p-6 bg-white border-2 border-black shadow-neo">
      <div className="space-y-3 border-b-2 border-black pb-4 mb-4">
        <div className="flex justify-between">
          <Skeleton width="w-24" height="h-4" />
          <Skeleton width="w-16" height="h-4" />
        </div>
        <div className="flex justify-between">
          <Skeleton width="w-32" height="h-6" />
          <Skeleton width="w-24" height="h-6" />
        </div>
      </div>
      <Skeleton width="w-full" height="h-14" />
    </div>
  </div>
);

// Generic page skeleton
export const PageSkeleton = ({ title = true, content = 5 }) => (
  <div className="p-6">
    {title && (
      <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
        <Skeleton width="w-64" height="h-10" />
        <Skeleton width="w-32" height="h-12" />
      </div>
    )}

    <div className="space-y-6">
      {Array.from({ length: content }).map((_, i) => (
        <div key={i} className="border-2 border-black shadow-neo bg-white p-6">
          <Skeleton width="w-full" height="h-4" className="mb-4" />
          <Skeleton width="w-full" height="h-4" className="mb-4" />
          <Skeleton width="w-2/3" height="h-4" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;




