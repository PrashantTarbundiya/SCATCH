import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useNotifications = (options = {}) => {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchNotifications = useCallback(async (page = 1, limit = 20, showLoading = true) => {
    if (loading && showLoading) return;
    
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/notifications?page=${page}&limit=${limit}`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount || response.data.notifications.filter(n => !n.isRead).length);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (showLoading) {
        setError(error.response?.data?.message || 'Failed to fetch notifications');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [loading]);

  const markAsRead = useCallback(async (notificationId) => {
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
        return response.data.notification;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/mark-all-read`, 
        {}, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        return response.data;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read');
      throw error;
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/clear-all`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
        setPagination(null);
        return response.data;
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setError('Failed to clear notifications');
      throw error;
    }
  }, []);

  const refreshNotifications = useCallback(() => {
    fetchNotifications(1, 20, false); // Silent refresh
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    
    if (autoRefresh) {
      const interval = setInterval(refreshNotifications, 60000); // 1 minute
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, autoRefresh, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    refreshNotifications,
    setError
  };
};