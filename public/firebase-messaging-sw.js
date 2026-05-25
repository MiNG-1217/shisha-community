importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
apiKey: "AIzaSyCtcstaenhgoAxaSkgxfA-z2i-eT4oHJHs",
authDomain: "[shisha-community-bae8b.firebaseapp.com](http://shisha-community-bae8b.firebaseapp.com/)",
projectId: "shisha-community-bae8b",
storageBucket: "shisha-community-bae8b.firebasestorage.app",
messagingSenderId: "441702056966",
appId: "1:441702056966:web:9a1395b476556a7f432f87"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
const { title, body } = payload.notification;
self.registration.showNotification(title, {
body,
icon: '/logo192.png'
});
});