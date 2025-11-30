import React, { useState, useEffect } from 'react';
import AdminOrderStatusUpdate from '../components/AdminOrderStatusUpdate';
import { PageSkeleton } from '../components/ui/SkeletonLoader.jsx';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/admin/all-orders`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Error fetching orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = (updatedOrder) => {
    setOrders(orders.map(order => 
      order._id === updatedOrder._id ? updatedOrder : order
    ));
    setSelectedOrder(null);
  };

  if (loading) return (
    <div className="w-full">
      <div className="bg-[#2A1F47] rounded-2xl shadow-lg shadow-purple-500/20 p-6 mb-8 border border-purple-500/20">
        <div className="bg-gray-700 animate-pulse h-8 w-64 rounded mb-2"></div>
        <div className="bg-gray-700 animate-pulse h-4 w-48 rounded"></div>
      </div>
      <PageSkeleton title={false} content={6} />
    </div>
  );
  if (error) return <div className="w-full p-6 text-red-500 dark:text-red-400">Error: {error}</div>;

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="bg-[#2A1F47] rounded-2xl shadow-lg shadow-purple-500/20 p-6 mb-8 border border-purple-500/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-100 mb-2">Order Management</h1>
            <p className="text-purple-300">Track and update order delivery status</p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6">
        {orders.map(order => (
          <div key={order._id} className="bg-[#2A1F47] rounded-2xl shadow-lg shadow-purple-500/20 p-6 border border-purple-500/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-purple-100">Order #{order._id.slice(-8)}</h3>
                <p className="text-sm text-purple-200">Customer: {order.user?.fullname || order.user?.email}</p>
                <p className="text-sm text-purple-200">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                <p className="text-sm text-purple-200">Total: ₹{order.totalAmount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-xl text-sm font-semibold ${
                  order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  order.orderStatus === 'Processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-[#1E1538] text-purple-200'
                }`}>
                  {order.orderStatus || 'Processing'}
                </span>
                <button
                  onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
                  className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg dark:shadow-purple-500/20 transition-all duration-200 hover:scale-105 text-sm font-semibold"
                >
                  {selectedOrder === order._id ? 'Cancel' : 'Update Status'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-purple-200">Items:</h4>
              <ul className="text-sm text-purple-300 space-y-1">
                {order.items.map(item => (
                  <li key={item._id} className="bg-[#1E1538] p-2 rounded-lg">
                    {item.nameAtPurchase} - Qty: {item.quantity} - ₹{item.priceAtPurchase.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>

            {selectedOrder === order._id && (
              <AdminOrderStatusUpdate 
                order={order} 
                onStatusUpdate={handleStatusUpdate}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrdersPage;







