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
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3">
              <i className="ri-bar-chart-groupped-line"></i>
              <span>Sales Analytics</span>
            </h1>
            <p className="text-lg font-bold text-gray-600 uppercase">Track your performance</p>
          </div>

          {/* Date Range Filters */}
          <div className="flex flex-col gap-4 w-full md:w-auto">
            {/* Time Period Dropdown */}
            <div className="flex flex-col">
              <label className="text-xs font-black uppercase mb-1">Time Period</label>
              <div className="relative">
                <select
                  value={dateRangePreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-black font-bold uppercase focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none"
                >
                  <option value="all">All Time</option>
                  <option value="1m">Past Month</option>
                  <option value="3m">Past 3 Months</option>
                  <option value="6m">Past 6 Months</option>
                  <option value="1y">Past Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <i className="ri-arrow-down-s-line text-xl font-bold"></i>
                </div>
              </div>
            </div>

            {/* Custom Date Inputs */}
            {dateRangePreset === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col flex-1">
                  <label className="text-xs font-black uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-xs font-black uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border-2 border-black font-bold bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-8">
        {loading && (
          <>
            <StatsSkeleton />
            <PageSkeleton title={false} content={8} />
          </>
        )}

        {error && (
          <div className="bg-red-50 border-4 border-black shadow-neo p-6">
            <p className="text-red-600 font-black uppercase text-xl mb-4">Error fetching analytics: {error}</p>
            <button
              onClick={fetchAnalytics}
              className="px-6 py-2 bg-red-600 text-white font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-400 border-4 border-black shadow-neo p-6 text-black relative overflow-hidden group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                <div className="relative z-10">
                  <h3 className="text-lg font-black uppercase mb-2">Total Revenue</h3>
                  <p className="text-4xl font-black">₹{analytics.overview.totalRevenue.toFixed(2)}</p>
                  {analytics.overview.dateRange?.start && (
                    <p className="text-xs font-bold mt-2 uppercase bg-black text-white w-fit px-2 py-1">
                      {new Date(analytics.overview.dateRange.start).toLocaleDateString()} - {analytics.overview.dateRange.end ? new Date(analytics.overview.dateRange.end).toLocaleDateString() : 'Now'}
                    </p>
                  )}
                </div>
                <i className="ri-money-dollar-circle-line absolute -bottom-4 -right-4 text-9xl opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
              </div>
              <div className="bg-green-400 border-4 border-black shadow-neo p-6 text-black relative overflow-hidden group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                <div className="relative z-10">
                  <h3 className="text-lg font-black uppercase mb-2">Total Orders</h3>
                  <p className="text-4xl font-black">{analytics.overview.totalOrders}</p>
                </div>
                <i className="ri-shopping-cart-2-line absolute -bottom-4 -right-4 text-9xl opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
              </div>
              <div className="bg-purple-400 border-4 border-black shadow-neo p-6 text-black relative overflow-hidden group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                <div className="relative z-10">
                  <h3 className="text-lg font-black uppercase mb-2">Avg Order Value</h3>
                  <p className="text-4xl font-black">₹{analytics.overview.avgOrderValue.toFixed(2)}</p>
                </div>
                <i className="ri-bar-chart-line absolute -bottom-4 -right-4 text-9xl opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
              </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Products */}
              <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex items-center gap-2">
                  <i className="ri-trophy-line"></i> Top Products
                </h3>
                <div className="space-y-4 overflow-x-auto">
                  {analytics.topProducts.length > 0 ? analytics.topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 border-2 border-black hover:bg-white hover:shadow-neo-sm transition-all min-w-[280px]">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-black uppercase truncate">{product.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs font-bold uppercase text-gray-600">
                          <span>Sold: {product.quantity}</span>
                          {product.category && (
                            <>
                              <span>|</span>
                              <span className="text-blue-600">{product.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="font-black text-green-600 whitespace-nowrap">₹{product.revenue.toFixed(2)}</p>
                    </div>
                  )) : (
                    <div className="p-8 text-center border-2 border-dashed border-black bg-gray-50">
                      <p className="font-bold uppercase text-gray-500">No products data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Customers */}
              <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex items-center gap-2">
                  <i className="ri-star-line"></i> Top Customers
                </h3>
                <div className="space-y-4 overflow-x-auto">
                  {analytics.topCustomers.length > 0 ? analytics.topCustomers.map((customer, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 border-2 border-black hover:bg-white hover:shadow-neo-sm transition-all min-w-[280px]">
                      <div>
                        <p className="font-black uppercase">{customer.name}</p>
                        <p className="text-xs font-bold uppercase text-gray-600">{customer.orderCount} orders • Avg: ₹{customer.avgOrderValue.toFixed(2)}</p>
                      </div>
                      <p className="font-black text-blue-600">₹{customer.totalSpent.toFixed(2)}</p>
                    </div>
                  )) : (
                    <div className="p-8 text-center border-2 border-dashed border-black bg-gray-50">
                      <p className="font-bold uppercase text-gray-500">No customer data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Revenue by Date & Sales by Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue by Date */}
              <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex items-center gap-2">
                  <i className="ri-line-chart-line"></i> Revenue Trend
                </h3>
                <div className="space-y-4 overflow-x-auto pb-2">
                  {analytics.revenueByDate.length > 0 ? analytics.revenueByDate.slice(-6).map((item, index) => {
                    const maxRevenue = Math.max(...analytics.revenueByDate.map(r => r.revenue));
                    const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                    return (
                      <div key={index} className="flex items-center gap-4 min-w-[300px]">
                        <span className="w-16 text-xs font-bold uppercase text-gray-600 text-right">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <div className="flex-1 bg-gray-100 border-2 border-black h-8 overflow-hidden relative group">
                          <div
                            className="bg-blue-500 h-full border-r-2 border-black transition-all duration-1000 group-hover:bg-blue-400"
                            style={{ width: `${percentage}%` }}
                          ></div>
                          <span className="absolute inset-0 flex items-center pl-2 text-xs font-black z-10 pointer-events-none">
                            ₹{item.revenue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-8 text-center border-2 border-dashed border-black bg-gray-50">
                      <p className="font-bold uppercase text-gray-500">No revenue data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sales by Category */}
              <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex items-center gap-2">
                  <i className="ri-pie-chart-line"></i> Sales by Category
                </h3>
                <div className="space-y-4">
                  {analytics.salesByCategory.length > 0 ? analytics.salesByCategory.slice(0, 5).map((cat, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border-b-2 border-black border-dashed last:border-0 last:pb-0">
                      <div>
                        <span className="font-black uppercase block">{cat.name}</span>
                        <p className="text-xs font-bold text-gray-600 uppercase">{cat.quantity} items • {cat.orderCount} orders</p>
                      </div>
                      <span className="font-black text-green-600">₹{cat.revenue.toFixed(2)}</span>
                    </div>
                  )) : (
                    <div className="p-8 text-center border-2 border-dashed border-black bg-gray-50">
                      <p className="font-bold uppercase text-gray-500">No category data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Status */}
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white border-4 border-black shadow-neo p-6 md:p-8">
                <h3 className="text-2xl font-black uppercase mb-6 border-b-4 border-black pb-2 flex items-center gap-2">
                  <i className="ri-list-check-2"></i> Orders by Status
                </h3>
                <div className="space-y-6">
                  {Object.keys(analytics.orderStats.byOrderStatus).length > 0 ? Object.entries(analytics.orderStats.byOrderStatus).map(([status, count]) => {
                    const percentage = (count / analytics.overview.totalOrders) * 100;

                    return (
                      <div key={status} className="flex items-center gap-4">
                        <span className="w-24 font-bold uppercase text-sm">{status}</span>
                        <div className="flex-1 bg-gray-100 border-2 border-black h-10 overflow-hidden relative">
                          <div
                            className={`h-full border-r-2 border-black transition-all duration-1000 ${status === 'Delivered' ? 'bg-green-400' :
                              status === 'Shipped' ? 'bg-blue-400' :
                                status === 'Processing' ? 'bg-yellow-400' :
                                  'bg-gray-400'
                              }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                            <span className="text-xs font-black uppercase">{percentage.toFixed(0)}%</span>
                            <span className="text-xs font-black uppercase">{count} Orders</span>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="p-8 text-center border-2 border-dashed border-black bg-gray-50">
                      <p className="font-bold uppercase text-gray-500">No order status data available</p>
                    </div>
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







