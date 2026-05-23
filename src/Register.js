import { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import ProfileSetup from "./ProfileSetup";

export default function Register({ inviteCode, onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [newUserDoc, setNewUserDoc] = useState(null);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      setError("全て入力してください");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, "invites"), where("code", "==", inviteCode), where("used", "==", false));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("招待URLが無効または使用済みです");
        setLoading(false);
        return;
      }
      const inviteDoc = snap.docs[0];
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {
        uid: result.user.uid,
        email,
        nickname,
        role: "member",
        profileDone: false,
      };
      await setDoc(doc(db, "users", result.user.uid), userData);
      await updateDoc(doc(db, "invites", inviteDoc.id), { used: true });
      await addDoc(collection(db, "notices"), {
        text: `${nickname}さんがメンバーになりました！`,
        type: "newMember",
        createdAt: serverTimestamp(),
      });
      setNewUserDoc(userData);
      setRegistered(true);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        setError("このメールアドレスは既に使われています");
      } else {
        setError("エラーが発生しました: " + e.message);
      }
    }
    setLoading(false);
  };

  if (registered && newUserDoc) {
    return <ProfileSetup userDoc={newUserDoc} onDone={onDone} />;
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.box}>
        <h1 style={styles.title}>🌿 Shisha Community</h1>
        <p style={styles.sub}>新規登録</p>
        <input placeholder="ニックネーム" value={nickname} onChange={(e) => setNickname(e.target.value)} style={styles.input} />
        <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
        <input type="password" placeholder="パスワード（6文字以上）" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btn} onClick={handleRegister} disabled={loading}>
          {loading ? "登録中..." : "登録する"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", backgroundColor: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" },
  box: { backgroundColor: "#16213e", padding: 40, borderRadius: 12, width: 320, textAlign: "center" },
  title: { color: "#c9a96e", marginBottom: 8, fontSize: 22 },
  sub: { color: "#888", marginBottom: 24 },
  input: { width: "100%", padding: 12, marginBottom: 12, borderRadius: 8, border: "1px solid #333", backgroundColor: "#0f3460", color: "white", boxSizing: "border-box", fontSize: 15 },
  error: { color: "#ff6b6b", marginBottom: 12 },
  btn: { width: "100%", padding: 12, backgroundColor: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 16, cursor: "pointer" },
};