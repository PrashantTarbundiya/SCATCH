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
      <div className="bg-white border-4 border-black shadow-neo p-6 mb-8">
        <div className="bg-gray-200 animate-pulse h-8 w-64 mb-2"></div>
        <div className="bg-gray-200 animate-pulse h-4 w-48"></div>
      </div>
      <PageSkeleton title={false} content={6} />
    </div>
  );
  if (error) return <div className="w-full p-6 text-red-600 font-bold border-2 border-red-600 bg-red-50 uppercase">Error: {error}</div>;

  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3">
              <i className="ri-shopping-bag-3-line"></i>
              <span>Order Management</span>
            </h1>
            <p className="text-lg font-bold text-gray-600 uppercase">Track and update order status</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {orders.map(order => (
          <div key={order._id} className="bg-white border-4 border-black shadow-neo p-6 md:p-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b-4 border-black pb-4 border-dashed">
              <div>
                <h3 className="text-2xl font-black uppercase mb-1">Order #{order._id.slice(-8)}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-bold uppercase text-gray-600">
                  <span><i className="ri-user-line"></i> {order.user?.fullname || order.user?.email}</span>
                  <span className="hidden sm:inline">|</span>
                  <span><i className="ri-calendar-line"></i> {new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <span className={`px-4 py-1 text-sm font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${order.orderStatus === 'Delivered' ? 'bg-green-400 text-black' :
                  order.orderStatus === 'Shipped' ? 'bg-blue-400 text-white' :
                    order.orderStatus === 'Processing' ? 'bg-yellow-400 text-black' :
                      'bg-gray-200 text-black'
                  }`}>
                  {order.orderStatus || 'Processing'}
                </span>
                <p className="text-xl font-black uppercase">Total: ₹{order.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-6 bg-gray-50 border-2 border-black p-4">
              <h4 className="font-black text-sm uppercase mb-3 border-b-2 border-black pb-1 w-fit">Items:</h4>
              <ul className="space-y-2">
                {order.items.map(item => (
                  <li key={item._id} className="flex justify-between items-center text-sm font-bold border-b border-black/10 pb-1 last:border-0 last:pb-0">
                    <span>{item.nameAtPurchase} <span className="text-gray-500">x{item.quantity}</span></span>
                    <span>₹{item.priceAtPurchase.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
                className={`px-6 py-2 font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 ${selectedOrder === order._id ? 'bg-gray-200 text-black' : 'bg-blue-600 text-white'
                  }`}
              >
                {selectedOrder === order._id ? (
                  <>
                    <i className="ri-close-line"></i> Cancel
                  </>
                ) : (
                  <>
                    <i className="ri-edit-line"></i> Update Status
                  </>
                )}
              </button>
            </div>

            {selectedOrder === order._id && (
              <div className="mt-6 border-t-4 border-black pt-6">
                <AdminOrderStatusUpdate
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrdersPage;







