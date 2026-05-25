import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { app } from "./firebase";

export const requestNotificationPermission = async () => {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("通知の許可取得に失敗:", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise(async (resolve) => {
    const supported = await isSupported();
    if (!supported) return;
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
