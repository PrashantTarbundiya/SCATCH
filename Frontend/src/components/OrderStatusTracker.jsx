import React from 'react';

const OrderStatusTracker = ({ currentStatus, estimatedDeliveryDate, statusHistory }) => {
  const statuses = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIndex = statuses.indexOf(currentStatus);

  const getStatusIcon = (status, index) => {
    if (index <= currentIndex) {
      return '✓';
    }
    return index;
  };

  const getStatusColor = (index) => {
    if (index < currentIndex) return 'bg-green-500 dark:bg-green-600';
    if (index === currentIndex) return 'bg-blue-500';
    return 'bg-gray-300 dark:bg-[#2A1F47]';
  };

  return (
    <div className="bg-white/80 dark:bg-[#1E1538]/60 backdrop-blur-xl border border-purple-500/20 rounded-lg p-6 shadow-lg dark:shadow-purple-500/20">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-purple-100">Order Status</h3>
      
      {/* Status Timeline */}
      <div className="relative mb-6">
        {/* Progress Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
        <div 
          className="absolute top-4 left-0 h-0.5 bg-green-500 dark:bg-green-600 transition-all duration-500"
          style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
        ></div>
        
        {/* Status Points */}
        <div className="relative flex justify-between">
          {statuses.map((status, index) => (
            <div key={status} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold z-10 ${getStatusColor(index)}`}>
                {getStatusIcon(status, index + 1)}
              </div>
              <span className={`text-xs mt-2 text-center max-w-16 leading-tight ${index <= currentIndex ? 'text-gray-900 dark:text-purple-100 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-semibold">Current Status:</span> {currentStatus}
        </p>
        {estimatedDeliveryDate && (
          <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
            <span className="font-semibold">Estimated Delivery:</span> {new Date(estimatedDeliveryDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Status History */}
      {statusHistory && statusHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-purple-100">Status History</h4>
          <div className="space-y-2">
            {statusHistory.slice().reverse().map((history, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-purple-200">{history.status}</span>
                <span className="text-gray-600 dark:text-purple-300">
                  {new Date(history.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusTracker;




