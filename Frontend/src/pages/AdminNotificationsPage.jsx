import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminNotificationsPage = () => {
  const [eventData, setEventData] = useState({
    title: '',
    message: '',
    eventCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');


  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/products`, {
        withCredentials: true
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSeasonalEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/seasonal-event`,
        eventData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert('Seasonal event notification sent to all users!');
        setEventData({ title: '', message: '', eventCode: '' });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="w-full space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Notification Management</h1>
        <p className="text-slate-600 dark:text-slate-400">Send notifications and manage alerts</p>
      </div>

      {/* Seasonal Events */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center">
          <i className="ri-calendar-event-line mr-3 text-blue-600"></i>
          Seasonal Events
        </h2>
        
        <form onSubmit={handleSeasonalEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Event Title
            </label>
            <input
              type="text"
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., Winter Sale 2024"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Message
            </label>
            <textarea
              value={eventData.message}
              onChange={(e) => setEventData({ ...eventData, message: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., Get up to 50% off on all winter items!"
              rows="3"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Event Code (Optional)
            </label>
            <input
              type="text"
              value={eventData.eventCode}
              onChange={(e) => setEventData({ ...eventData, eventCode: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., WINTER2024"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
          >
            {loading ? 'Sending...' : 'Send to All Users'}
          </button>
        </form>
      </div>


    </div>
  );
};

export default AdminNotificationsPage;