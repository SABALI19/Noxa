// src/hooks/useNotificationTracking.jsx
import { useContext } from 'react';
import NotificationTrackingContext from '../context/NotificationTrackingContext'; // FIXED: Changed from NotificationContext

export const useNotificationTracking = () => { // FIXED: Changed from useNotifications
  const context = useContext(NotificationTrackingContext);
  
  if (!context) {
    throw new Error('useNotificationTracking must be used within a NotificationTrackingProvider'); // FIXED: Updated error message
  }
  
  return context;
};