import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();

  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (isAuthenticated) {
      fetchNotifications();
      
      // Auto-refresh every 1 minute silently
      const interval = setInterval(() => fetchNotifications(false), 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const fetchNotifications = async (showLoading = true) => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) return;
    
    if (loading && showLoading) return;
    
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount || response.data.notifications.filter(n => !n.isRead).length);
      }
    } catch (error) {
      // Silently handle 401 errors (user not authenticated)
      if (error.response?.status === 401) {
        return;
      }
      
      console.error('Error fetching notifications:', error);
      if (showLoading) {
        setError('Failed to load notifications');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const markAsRead = async (notificationId, actionUrl = null) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/${notificationId}/read`, 
        {}, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Navigate if action URL exists
        if (actionUrl) {
          setIsOpen(false);
          navigate(actionUrl);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark as read');
    }
  };

  const markAllAsRead = async (e) => {
    e.stopPropagation();
    
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/mark-all-read`, 
        {}, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all as read');
    }
  };

  const clearAll = async (e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }
    
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/clear-all`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setError('Failed to clear notifications');
    }
  };

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatNotificationData = (notification) => {
    const { data, type } = notification;
    if (!data) return null;

    switch (type) {
      case 'price_drop':
        return (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Old: ₹{data.oldPrice} → New: ₹{data.newPrice} ({data.changePercentage}% off)
          </div>
        );
      case 'coupon_alert':
        return (
          <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded mt-1">
            Code: <span className="font-mono font-bold">{data.couponCode}</span>
            {data.validUntil && (
              <div className="text-xs mt-1">Valid until: {new Date(data.validUntil).toLocaleDateString()}</div>
            )}
          </div>
        );
      case 'stock_alert':
        return (
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Stock Level: {data.stockLevel} items
          </div>
        );
      default:
        return null;
    }
  };

  // Don't render notification bell if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <i className="ri-notification-3-line text-xl"></i>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="ri-notification-3-line"></i>
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-8 w-8 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-4 w-3/4 rounded"></div>
                        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-3 w-full rounded"></div>
                        <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-3 w-1/2 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <i className="ri-notification-off-line text-4xl mb-2"></i>
                  <p>No notifications yet</p>
                  <p className="text-xs mt-1">We'll notify you about important updates</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => markAsRead(notification._id, notification.actionUrl)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        {formatNotificationData(notification)}
                        
                        {notification.product && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            {notification.product.image && (
                              <img 
                                src={notification.product.image} 
                                alt={notification.product.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              {notification.product.name}
                            </p>
                            {notification.product.price && (
                              <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                                ₹{notification.product.price}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                          {notification.actionUrl && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              Click to view →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 text-center border-t border-gray-200 dark:border-gray-600">
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;