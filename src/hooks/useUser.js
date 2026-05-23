import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

export function useUser() {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubDoc) unsubDoc();

      if (firebaseUser) {
        setUser(firebaseUser);
        const ref = doc(db, "users", firebaseUser.uid);
        unsubDoc = onSnapshot(ref, async (snap) => {
          if (snap.exists()) {
            setUserDoc(snap.data());
          } else {
            const newDoc = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              nickname: firebaseUser.email.split("@")[0],
              role: "member",
              profileDone: false,
            };
            await setDoc(ref, newDoc);
            setUserDoc(newDoc);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserDoc(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const isAdmin = userDoc?.role === "admin";
  return { user, userDoc, isAdmin, loading };
}