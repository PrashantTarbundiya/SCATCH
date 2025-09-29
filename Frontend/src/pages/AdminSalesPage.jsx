import React, { useState, useEffect } from 'react';
import { StatsSkeleton, PageSkeleton } from '../components/ui/SkeletonLoader.jsx';

const AdminSalesPage = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0
    },
    revenueByDate: [],
    topProducts: [],
    salesByCategory: [],
    topCustomers: [],
    orderStats: {
      byOrderStatus: {},
      byPaymentStatus: {}
    },
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRangePreset, setDateRangePreset] = useState('all'); // 'all', '1m', '3m', '6m', '1y', 'custom'
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Calculate date range based on preset
  const calculateDateRange = (preset) => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate = '';

    switch (preset) {
      case '1m':
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        startDate = oneMonthAgo.toISOString().split('T')[0];
        break;
      case '3m':
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        startDate = threeMonthsAgo.toISOString().split('T')[0];
        break;
      case '6m':
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        startDate = sixMonthsAgo.toISOString().split('T')[0];
        break;
      case '1y':
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        startDate = oneYearAgo.toISOString().split('T')[0];
        break;
      case 'all':
      default:
        startDate = '';
        break;
    }

    return { startDate, endDate: preset === 'all' ? '' : endDate };
  };

  // Handle preset change
  const handlePresetChange = (preset) => {
    setDateRangePreset(preset);
    if (preset !== 'custom') {
      const newRange = calculateDateRange(preset);
      setDateRange(newRange);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/analytics/sales?${params.toString()}`,
        { credentials: 'include' }
      );
      
      let data;
      if (response.headers.get("content-type")?.includes("application/json")) {
        data = await response.json();
      }
      
      if (!response.ok) {
        throw new Error(data?.error || data?.message || response.statusText || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      } else {
        throw new Error('Invalid analytics data received');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to fetch analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white mb-2">Sales Analytics</h1>
            <p className="text-slate-600 dark:text-slate-400">Track and analyze your sales performance</p>
          </div>
          
          {/* Date Range Filters */}
          <div className="flex flex-col gap-3">
            {/* Time Period Dropdown */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 dark:text-slate-400 mb-1">Time Period</label>
              <select
                value={dateRangePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="1m">Past Month</option>
                <option value="3m">Past 3 Months</option>
                <option value="6m">Past 6 Months</option>
                <option value="1y">Past Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Inputs - Show only when Custom is selected */}
            {dateRangePreset === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-6">
        {loading && (
          <>
            <StatsSkeleton />
            <PageSkeleton title={false} content={8} />
          </>
        )}
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <p className="text-red-600 dark:text-red-400">Error fetching analytics: {error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        )}
        
        {!loading && !error && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold">₹{analytics.overview.totalRevenue.toFixed(2)}</p>
                <p className="text-sm mt-2 opacity-90">{analytics.overview.dateRange?.start} - {analytics.overview.dateRange?.end}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
                <p className="text-3xl font-bold">{analytics.overview.totalOrders}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Avg Order Value</h3>
                <p className="text-3xl font-bold">₹{analytics.overview.avgOrderValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Products */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Top Products</h3>
                <div className="space-y-3">
                  {analytics.topProducts.length > 0 ? analytics.topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">{product.name}</p>
                        <div className="flex gap-3 mt-1">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Sold: {product.quantity} units</p>
                          {product.category && (
                            <p className="text-sm text-blue-600 dark:text-blue-400">• {product.category}</p>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-green-600 dark:text-green-400">₹{product.revenue.toFixed(2)}</p>
                    </div>
                  )) : (
                    <p className="text-slate-600 dark:text-slate-400 text-center py-4">No products data available</p>
                  )}
                </div>
              </div>

              {/* Top Customers */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Top Customers</h3>
                <div className="space-y-3">
                  {analytics.topCustomers.length > 0 ? analytics.topCustomers.map((customer, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{customer.orderCount} orders • Avg: ₹{customer.avgOrderValue.toFixed(2)}</p>
                      </div>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">₹{customer.totalSpent.toFixed(2)}</p>
                    </div>
                  )) : (
                    <p className="text-slate-600 dark:text-slate-400 text-center py-4">No customer data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Revenue by Date & Sales by Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue by Date */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Revenue Trend</h3>
                <div className="space-y-3">
                  {analytics.revenueByDate.length > 0 ? analytics.revenueByDate.slice(-6).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-3">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(item.revenue / Math.max(...analytics.revenueByDate.map(r => r.revenue))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white">₹{item.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-slate-600 dark:text-slate-400 text-center py-4">No revenue data available</p>
                  )}
                </div>
              </div>

              {/* Sales by Category */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Sales by Category</h3>
                <div className="space-y-3">
                  {analytics.salesByCategory.length > 0 ? analytics.salesByCategory.slice(0, 5).map((cat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="text-slate-800 dark:text-white font-medium">{cat.name}</span>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{cat.quantity} items • {cat.orderCount} orders</p>
                      </div>
                      <span className="font-semibold text-green-600 dark:text-green-400">₹{cat.revenue.toFixed(2)}</span>
                    </div>
                  )) : (
                    <p className="text-slate-600 dark:text-slate-400 text-center py-4">No category data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Orders by Status</h3>
                <div className="space-y-3">
                  {Object.keys(analytics.orderStats.byOrderStatus).length > 0 ? Object.entries(analytics.orderStats.byOrderStatus).map(([status, count]) => (
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
                            style={{ width: `${(count / analytics.overview.totalOrders) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white">{count}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-slate-600 dark:text-slate-400 text-center py-4">No order status data available</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSalesPage;