importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
);
// // Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyDsCKZZsISB1uRfp8SmdYmjFd2v1lTPc88",
  authDomain: "ammart-8a61b.firebaseapp.com",
  projectId: "ammart-8a61b",
  storageBucket: "ammart-8a61b.firebasestorage.app",
  messagingSenderId: "687748502892",
  appId: "1:687748502892:web:7997df9e1197560050cf49",
  measurementId: "G-PZGXKKCQ4L"
};

firebase?.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase?.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
