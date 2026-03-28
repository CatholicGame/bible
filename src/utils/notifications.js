/**
 * Web Push Notification utilities — Firebase Cloud Messaging
 */
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import app from '../config/firebase';

const VAPID_KEY = 'BHxPAq0pIn1QY9k-4Gu_sdc3i3sSQ3ZDwenjf4bKQ5AGcRGkM6TBwA9V4fMy-tTnNUddQ5FSuf_1I6edQ-nrAO0';

let _messaging = null;

function getMessagingInstance() {
  if (!_messaging) _messaging = getMessaging(app);
  return _messaging;
}

/** Check current permission state: 'default' | 'granted' | 'denied' */
export function getPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Request permission + get FCM token
 * Returns the token string, or null if denied/failed
 */
export async function requestPermissionAndGetToken() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('[FCM] Notifications not supported');
    return null;
  }

  // Register service worker if not yet
  let swReg;
  try {
    swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  } catch (e) {
    console.error('[FCM] SW registration failed', e);
    return null;
  }

  // Request browser permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('[FCM] Permission denied');
    return null;
  }

  try {
    const messaging = getMessagingInstance();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    console.log('[FCM] Token:', token);
    return token;
  } catch (e) {
    console.error('[FCM] getToken failed', e);
    return null;
  }
}

/**
 * Delete current FCM token (unsubscribe from notifications)
 */
export async function deleteFcmToken() {
  try {
    const messaging = getMessagingInstance();
    await deleteToken(messaging);
    console.log('[FCM] Token deleted');
    return true;
  } catch (e) {
    console.warn('[FCM] deleteToken failed', e);
    return false;
  }
}

/**
 * Listen for foreground messages (app is open)
 * Returns unsubscribe function
 */
export function onForegroundMessage(callback) {
  const messaging = getMessagingInstance();
  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message:', payload);
    callback(payload);
  });
}
