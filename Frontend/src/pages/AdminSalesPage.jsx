import React, { useState, useEffect } from 'react';

const AdminSalesPage = () => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topProducts: [],
    topCustomers: [],
    monthlyRevenue: [],
    ordersByStatus: {}
  });

  const calculateAnalytics = (ordersData) => {
    const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = ordersData.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products by quantity sold
    const productStats = {};
    ordersData.forEach(order => {
      order.items.forEach(item => {
        const productName = item.nameAtPurchase || item.product?.name || 'Unknown';
        if (!productStats[productName]) {
          productStats[productName] = { quantity: 0, revenue: 0 };
        }
        productStats[productName].quantity += item.quantity;
        productStats[productName].revenue += item.quantity * item.priceAtPurchase;
      });
    });
    const topProducts = Object.entries(productStats)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(([name, stats]) => ({ name, ...stats }));

    // Top customers by total spent
    const customerStats = {};
    ordersData.forEach(order => {
      const customerName = order.user?.fullname || order.user?.email || 'Unknown';
      if (!customerStats[customerName]) {
        customerStats[customerName] = { orders: 0, totalSpent: 0 };
      }
      customerStats[customerName].orders += 1;
      customerStats[customerName].totalSpent += order.totalAmount;
    });
    const topCustomers = Object.entries(customerStats)
      .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(([name, stats]) => ({ name, ...stats }));

    // Monthly revenue (last 6 months)
    const monthlyStats = {};
    ordersData.forEach(order => {
      const month = new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyStats[month] = (monthlyStats[month] || 0) + order.totalAmount;
    });
    const monthlyRevenue = Object.entries(monthlyStats)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-6)
      .map(([month, revenue]) => ({ month, revenue }));

    // Orders by status
    const ordersByStatus = {};
    ordersData.forEach(order => {
      const status = order.orderStatus || 'Processing';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topProducts,
      topCustomers,
      monthlyRevenue,
      ordersByStatus
    };
  };

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
      const ordersData = data?.orders || [];
      setOrders(ordersData);
      setAnalytics(calculateAnalytics(ordersData));
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
        
        {!ordersLoading && !ordersError && orders.length > 0 && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
                <p className="text-3xl font-bold">{analytics.totalOrders}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Avg Order Value</h3>
                <p className="text-3xl font-bold">₹{analytics.avgOrderValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Products */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Top Products</h3>
                <div className="space-y-3">
                  {analytics.topProducts.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{product.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Sold: {product.quantity} units</p>
                      </div>
                      <p className="font-semibold text-green-600 dark:text-green-400">₹{product.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Customers */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Top Customers</h3>
                <div className="space-y-3">
                  {analytics.topCustomers.map((customer, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{customer.orders} orders</p>
                      </div>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">₹{customer.totalSpent.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Revenue & Order Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Revenue */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Monthly Revenue</h3>
                <div className="space-y-3">
                  {analytics.monthlyRevenue.map((month, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">{month.month}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(month.revenue / Math.max(...analytics.monthlyRevenue.map(m => m.revenue))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white">₹{month.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Orders by Status</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">{status}</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              status === 'Delivered' ? 'bg-green-500' :
                              status === 'Shipped' ? 'bg-blue-500' :
                              status === 'Processing' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${(count / analytics.totalOrders) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {!ordersLoading && !ordersError && orders.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-slate-600 dark:text-slate-400">No sales data found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesPage;