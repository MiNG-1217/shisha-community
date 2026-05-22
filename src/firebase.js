import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtcstaenhgoAxaSkgxfA-z2i-eT4oHJHs",
  authDomain: "shisha-community-bae8b.firebaseapp.com",
  projectId: "shisha-community-bae8b",
  storageBucket: "shisha-community-bae8b.firebasestorage.app",
  messagingSenderId: "441702056966",
  appId: "1:441702056966:web:9a1395b476556a7f432f87"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);