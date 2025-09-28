import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

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
      case 'low': return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
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
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <i className="ri-notification-3-line"></i>
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm px-3 py-1 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Stay updated with your latest activities and offers
              </p>
            </div>
            
            <div className="flex gap-3">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <i className="ri-check-double-line"></i>
                    Mark All Read
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <i className="ri-delete-bin-line"></i>
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
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
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <i className={icon}></i>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <i className="ri-error-warning-line text-red-600 dark:text-red-400"></i>
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && notifications.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-loader-4-line animate-spin text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-notification-off-line text-6xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {filter === 'all' ? 'No notifications yet' : `No ${filter.replace('_', ' ')} notifications`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'all' 
                  ? "We'll notify you about important updates and offers"
                  : `You don't have any ${filter.replace('_', ' ')} notifications`
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
                  className={`${getPriorityColor(notification.priority, notification.type)} ${
                    !notification.isRead ? 'ring-2 ring-blue-500/20' : ''
                  } hover:shadow-md transition-all cursor-pointer`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <span className="text-3xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          {formatNotificationData(notification)}
                          
                          {notification.product && (
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                {notification.product.image && (
                                  <img 
                                    src={notification.product.image} 
                                    alt={notification.product.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {notification.product.name}
                                  </p>
                                  {notification.product.price && (
                                    <p className="text-green-600 dark:text-green-400 font-semibold">
                                      ₹{notification.product.price}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                            {notification.actionUrl && (
                              <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                Click to view <i className="ri-arrow-right-line"></i>
                              </span>
                            )}
                          </div>
                        </div>
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
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <i className="ri-arrow-left-line"></i>
              </button>
              
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {currentPage} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
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