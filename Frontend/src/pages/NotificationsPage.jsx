import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { PageSkeleton } from '../components/ui/SkeletonLoader.jsx';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    setError
  } = useNotifications({ autoRefresh: false });

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage, fetchNotifications]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    if (filter !== 'all') return notification.type === filter;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'stock_alert': return '📦';
      case 'price_drop': return '💰';
      case 'wishlist_update': return '❤️';

      case 'coupon_alert': return '🎫';
      case 'order_status': return '📋';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority, type) => {
    if (type === 'coupon_alert') {
      return 'bg-blue-50 dark:bg-blue-900/20';
    }
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-gray-500 bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E]/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1A1333] dark:to-[#0F0A1E]/20';
    }
  };

  const formatNotificationData = (notification) => {
    const { data, type } = notification;
    if (!data) return null;

    switch (type) {
      case 'price_drop':
        return (
          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700 dark:text-green-300">
                Price Drop: {data.changePercentage}% off
              </span>
              <div className="text-sm">
                <span className="line-through text-gray-500">₹{data.oldPrice}</span>
                <span className="ml-2 font-bold text-green-600">₹{data.newPrice}</span>
              </div>
            </div>
          </div>
        );
      case 'coupon_alert':
        return (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Coupon Code:
                </span>
                <code className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded font-mono text-sm">
                  {data.couponCode}
                </code>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(data.couponCode);
                  // You could add a toast notification here
                }}
                className="text-xs bg-blue-600 dark:bg-purple-600 text-white px-2 py-1 rounded hover:bg-blue-700 dark:hover:bg-purple-700 transition-colors"
              >
                Copy
              </button>
            </div>
            {data.validUntil && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Valid until: {new Date(data.validUntil).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      case 'stock_alert':
        return (
          <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
            <span className="text-sm text-orange-700 dark:text-orange-300">
              Stock Level: {data.stockLevel} items
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      try {
        await clearAllNotifications();
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pt-28 pb-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-10 bg-white border-4 border-black shadow-neo p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter flex flex-wrap items-center gap-4">
                <i className="ri-notification-3-line"></i>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-sm font-bold uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
              <p className="text-lg font-bold text-gray-600 uppercase mt-2">
                Stay updated with your latest activities
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex-1 md:flex-none px-6 py-3 bg-purple-600 text-white font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <i className="ri-check-double-line"></i>
                    <span>Mark All Read</span>
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex-1 md:flex-none px-6 py-3 bg-red-600 text-white font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <i className="ri-delete-bin-line"></i>
                    <span>Clear All</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: 'All', icon: 'ri-list-check' },
              { key: 'unread', label: 'Unread', icon: 'ri-mail-unread-line' },
              { key: 'price_drop', label: 'Price Drops', icon: 'ri-price-tag-3-line' },
              { key: 'stock_alert', label: 'Stock Alerts', icon: 'ri-archive-line' },
              { key: 'coupon_alert', label: 'Coupons', icon: 'ri-coupon-line' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 font-bold uppercase border-2 border-black transition-all flex items-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] ${filter === key
                  ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]'
                  : 'bg-white text-black shadow-neo-sm hover:shadow-none'
                  }`}
              >
                <i className={icon}></i>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{key === 'price_drop' ? 'Prices' : key === 'stock_alert' ? 'Stock' : key === 'coupon_alert' ? 'Coupons' : label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border-4 border-black shadow-neo">
            <div className="flex items-center gap-4">
              <i className="ri-error-warning-line text-3xl text-red-600"></i>
              <p className="text-xl font-bold uppercase text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-black hover:text-red-600"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-6">
          {loading && notifications.length === 0 ? (
            <PageSkeleton title={false} content={5} />
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-white border-4 border-black shadow-neo border-dashed">
              <i className="ri-notification-off-line text-6xl text-gray-400 mb-4 block"></i>
              <h3 className="text-2xl font-black uppercase mb-2">
                {filter === 'all' ? 'No notifications yet' : `No ${filter.replace('_', ' ')} notifications`}
              </h3>
              <p className="text-lg font-bold text-gray-500 uppercase">
                {filter === 'all'
                  ? "We'll notify you about important updates"
                  : `You don't have any ${filter.replace('_', ' ')}`
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${getPriorityColor(notification.priority, notification.type)} ${!notification.isRead ? 'border-l-[12px]' : 'border-l-4'
                    } border-4 border-black bg-white mb-4 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer p-6 relative`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-6">
                    <span className="text-4xl flex-shrink-0 bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {getNotificationIcon(notification.type)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black uppercase break-words">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="bg-blue-600 text-white text-xs font-bold uppercase px-2 py-0.5 border-2 border-black">NEW</span>
                        )}
                      </div>

                      <p className="text-base font-bold text-gray-700 uppercase mb-4 leading-relaxed">
                        {notification.message}
                      </p>

                      {formatNotificationData(notification)}

                      {notification.product && (
                        <div className="mt-4 p-4 bg-gray-50 border-2 border-black">
                          <div className="flex items-center gap-4">
                            {notification.product.image && (
                              <img
                                src={notification.product.image}
                                alt={notification.product.name}
                                className="w-16 h-16 object-cover border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-black uppercase text-lg">
                                {notification.product.name}
                              </p>
                              {notification.product.price && (
                                <p className="text-green-600 font-black text-xl">
                                  ₹{notification.product.price}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-4 border-t-2 border-black border-dashed">
                        <span className="text-sm font-bold text-gray-500 uppercase">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {notification.actionUrl && (
                          <span className="text-sm font-black text-blue-600 uppercase flex items-center gap-1 hover:underline decoration-2 underline-offset-2">
                            View Details <i className="ri-arrow-right-line"></i>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white text-black font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <i className="ri-arrow-left-line"></i>
              </button>

              <span className="px-4 py-2 font-bold uppercase border-2 border-black bg-white">
                Page {currentPage} of {pagination.pages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 bg-white text-black font-black uppercase border-2 border-black shadow-neo-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;







