import React, { useState, useEffect } from 'react';
// We might need Link or other imports later if we add navigation within this page

const AdminSalesPage = () => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const fetchAllOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/admin/all-orders`, { credentials: 'include' });
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
      }
      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      setOrders(data?.orders || []);
    } catch (err) {
      setOrdersError(err.message || 'Failed to fetch orders.');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white mb-2">Sales Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400">Track and analyze your sales performance</p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-6">
        {ordersLoading && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300 text-center">Loading sales data...</p>
          </div>
        )}
        
        {ordersError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <p className="text-red-600 dark:text-red-400">Error fetching sales data: {ordersError}</p>
          </div>
        )}
        
        {!ordersLoading && !ordersError && (
          <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700">
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-600 dark:text-slate-400">No sales data found.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">Items</th>
                    <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-3 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200">
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{order._id.slice(-8)}</td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {order.user ? (
                          <>
                            <div className="font-medium">{order.user.fullname}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{order.user.email}</div>
                          </>
                        ) : 'N/A'}
                      </td>
                      <td className="px-3 md:px-6 py-4 text-sm text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                        <div className="max-w-xs">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-xs mb-1">
                              {item.product ? item.product.name : item.nameAtPurchase} (×{item.quantity})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">₹{order.totalAmount.toFixed(2)}</td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-xl ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                          'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesPage;