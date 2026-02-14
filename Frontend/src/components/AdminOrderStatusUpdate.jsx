import React, { useState } from 'react';

const AdminOrderStatusUpdate = ({ order, onStatusUpdate }) => {
  const [status, setStatus] = useState(order.orderStatus || 'Processing');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const statuses = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/admin/${order._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, trackingNumber, note }),
      });

      const data = await response.json();
      if (response.ok) {
        onStatusUpdate(data.order);
        alert('Order status updated successfully!');
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (error) {
      alert('Error updating order status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 border-4 border-black shadow-neo">
      <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
        <i className="ri-edit-box-line"></i> Update Order Status
      </h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold uppercase mb-2">Status</label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 border-2 border-black bg-white text-black font-bold uppercase focus:outline-none focus:shadow-neo-sm transition-all appearance-none"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="ri-arrow-down-s-line font-black text-xl"></i>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase mb-2">Tracking Number (Optional)</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full p-3 border-2 border-black bg-white text-black font-bold placeholder-gray-500 focus:outline-none focus:shadow-neo-sm transition-all"
            placeholder="ENTER TRACKING NUMBER"
          />
        </div>

        <div>
          <label className="block text-sm font-bold uppercase mb-2">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 border-2 border-black bg-white text-black font-bold placeholder-gray-500 focus:outline-none focus:shadow-neo-sm transition-all"
            placeholder="ADD A NOTE..."
            rows="2"
          />
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-green-500 text-black border-2 border-black py-3 px-6 font-black uppercase shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="ri-loader-4-line animate-spin text-xl"></i> Updating...
            </>
          ) : (
            <>
              <i className="ri-save-line text-xl"></i> Update Status
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminOrderStatusUpdate;




