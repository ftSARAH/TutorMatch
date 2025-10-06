import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../utils/api.js';

const NotificationsContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

export const NotificationsProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnread = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await apiClient.get('/notifications/unread-count');
      if (data.success) setUnreadCount(data.count);
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const { data } = await apiClient.get('/notifications?limit=10');
      if (data.success) setItems(data.notifications);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = async (id) => {
    await apiClient.put(`/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    fetchUnread();
  };

  const markAllRead = async () => {
    await apiClient.put('/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchUnread();
    fetchNotifications();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread, fetchNotifications]);

  return (
    <NotificationsContext.Provider value={{ items, unreadCount, loading, fetchNotifications, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};



