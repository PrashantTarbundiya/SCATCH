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
    <div className="w-full min-h-screen flex flex-col items-start py-20 pt-28 px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Sales Analytics</h1>
        {ordersLoading && <p className="dark:text-gray-300">Loading sales data...</p>}
        {ordersError && <p className="text-red-500 dark:text-red-400">Error fetching sales data: {ordersError}</p>}
        {!ordersLoading && !ordersError && (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
            {orders.length === 0 ? (
              <p className="p-4 text-gray-600 dark:text-gray-400">No sales data found.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Items</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{order._id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {order.user ? `${order.user.fullname} (${order.user.email})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        <ul className="list-disc list-inside">
                          {order.items.map((item, index) => (
                            <li key={index}>
                              {item.product ? item.product.name : item.nameAtPurchase} (Qty: {item.quantity}) @ ₹{item.priceAtPurchase.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">₹{order.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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