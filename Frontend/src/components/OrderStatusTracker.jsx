import React from 'react';

const OrderStatusTracker = ({ currentStatus, estimatedDeliveryDate, statusHistory }) => {
  const statuses = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIndex = statuses.indexOf(currentStatus);

  const getStatusIcon = (status, index) => {
    if (index <= currentIndex) {
      return <i className="ri-check-line font-black text-lg"></i>;
    }
    return <span className="font-black text-sm">{index + 1}</span>;
  };

  const getStatusColor = (index) => {
    if (index < currentIndex) return 'bg-green-500 text-black border-black';
    if (index === currentIndex) return 'bg-blue-500 text-white border-black';
    return 'bg-white text-gray-500 border-black';
  };

  return (
    <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
      <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-2">
        <i className="ri-map-pin-time-line"></i> Order Status
      </h3>

      {/* Status Timeline */}
      <div className="relative mb-8 px-2">
        {/* Progress Line Track */}
        <div className="absolute top-5 left-0 right-0 h-2 bg-gray-200 border-2 border-black"></div>

        {/* Progress Line Fill */}
        <div
          className="absolute top-5 left-0 h-2 bg-green-500 border-y-2 border-l-2 border-black transition-all duration-500"
          style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
        ></div>

        {/* Status Points */}
        <div className="relative flex justify-between w-full">
          {statuses.map((status, index) => (
            <div key={status} className="flex flex-col items-center group relative">
              <div
                className={`w-10 h-10 flex items-center justify-center border-2 z-10 transition-all duration-300 ${getStatusColor(index)} shadow-neo-sm group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px]`}
              >
                {getStatusIcon(status, index)}
              </div>
              <div className="absolute top-12 w-24 text-center">
                <span className={`text-xs font-bold uppercase leading-tight block ${index <= currentIndex ? 'text-black' : 'text-gray-400'}`}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Status Box */}
        <div className="bg-blue-50 border-4 border-black p-4 shadow-neo-sm">
          <p className="text-sm font-bold uppercase mb-1">Current Status</p>
          <p className="text-xl font-black text-blue-800 uppercase">{currentStatus}</p>

          {estimatedDeliveryDate && (
            <div className="mt-3 pt-3 border-t-2 border-black border-dashed">
              <p className="text-xs font-bold uppercase mb-1">Estimated Delivery</p>
              <p className="text-lg font-black">{new Date(estimatedDeliveryDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Status History */}
        {statusHistory && statusHistory.length > 0 && (
          <div className="border-4 border-black p-4 bg-gray-50">
            <h4 className="text-sm font-black uppercase mb-3 border-b-2 border-black pb-2">History</h4>
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {statusHistory.slice().reverse().map((history, index) => (
                <div key={index} className="flex justify-between items-start text-xs border-b border-gray-300 pb-2 last:border-0">
                  <span className="font-bold text-black uppercase">{history.status}</span>
                  <span className="font-medium text-gray-600">
                    {new Date(history.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusTracker;




