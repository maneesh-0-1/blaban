import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDsCKZZsISB1uRfp8SmdYmjFd2v1lTPc88",
  authDomain: "ammart-8a61b.firebaseapp.com",
  projectId: "ammart-8a61b",
  storageBucket: "ammart-8a61b.firebasestorage.app",
  messagingSenderId: "687748502892",
  appId: "1:687748502892:web:7997df9e1197560050cf49",
  measurementId: "G-PZGXKKCQ4L"
};

const firebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(firebaseApp);

// Correctly export a promise that resolves to messaging instance (or null)
export const getMessagingObject = async () => {
  try {
    if (typeof window === "undefined") return null;
    const { getMessaging, isSupported } = await import("firebase/messaging");
    const isSupportedBrowser = await isSupported();
    if (isSupportedBrowser) {
      return getMessaging(firebaseApp);
    }
    return null;
  } catch (err) {
    console.error("Messaging not supported:", err);
    return null;
  }
};

// fetchToken function
export const fetchToken = async (setTokenFound, setFcmToken) => {
  try {
    if (typeof window === "undefined") return;
    const messaging = await getMessagingObject();
    if (!messaging) return;

    const { getToken } = await import("firebase/messaging");
    const currentToken = await getToken(messaging, {
      vapidKey: "BLoYbYGafvOAwuSpGQcQirPdjHB6lqQPe3rjLIL07JkvvPJYndb09WpG8ZhmnYoSX18i5sjY6ODxbSabPyNu_2o",
    });

    if (currentToken) {
      setTokenFound(true);
      setFcmToken(currentToken);
    } else {
      setTokenFound(false);
      setFcmToken();
    }
  } catch (err) {
    console.error("Token fetch error:", err);
  }
};

// onMessageListener function
export const onMessageListener = async () =>
  new Promise(async (resolve, reject) => {
    try {
      if (typeof window === "undefined") return;
      const { onMessage } = await import("firebase/messaging");
      const messaging = await getMessagingObject();
      if (!messaging) return;

      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } catch (err) {
      reject(err);
    }
  });
