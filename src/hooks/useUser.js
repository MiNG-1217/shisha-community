import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function useUser() {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserDoc(snap.data());
        } else {
          const newDoc = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nickname: firebaseUser.email.split("@")[0],
            role: "member",
          };
          await setDoc(ref, newDoc);
          setUserDoc(newDoc);
        }
      } else {
        setUser(null);
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = userDoc?.role === "admin";
  return { user, userDoc, isAdmin, loading };
}