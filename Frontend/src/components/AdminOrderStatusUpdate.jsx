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
    <div className="bg-[#1E1538]/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600">
      <h3 className="text-lg font-semibold mb-4 text-purple-100">Update Order Status</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-purple-200">Status</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-3 border border-purple-500/30 rounded-xl bg-[#2A1F47] text-purple-100 focus:ring-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-purple-200">Tracking Number (Optional)</label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full p-3 border border-purple-500/30 rounded-xl bg-[#2A1F47] text-purple-100 placeholder-slate-400 dark:placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter tracking number"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-purple-200">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 border border-purple-500/30 rounded-xl bg-[#2A1F47] text-purple-100 placeholder-slate-400 dark:placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Add a note about this status update"
            rows="2"
          />
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200 hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </div>
  );
};

export default AdminOrderStatusUpdate;




