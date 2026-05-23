import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, addDoc, serverTimestamp, orderBy, query } from "firebase/firestore";

export default function Notices({ userDoc, isAdmin, onBack }) {
  const [notices, setNotices] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!text.trim()) return;
    setSending(true);
    await addDoc(collection(db, "notices"), {
      text: text.trim(),
      type: "manual",
      createdAt: serverTimestamp(),
      createdBy: userDoc.nickname,
    });
    setText("");
    setSending(false);
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate();
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📣 お知らせ</h2>

      {isAdmin && (
        <div style={styles.postBox}>
          <p style={styles.postLabel}>お知らせを投稿</p>
          <textarea
            style={styles.textarea}
            placeholder="お知らせ内容を入力..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button style={styles.postBtn} onClick={handlePost} disabled={sending}>
            {sending ? "投稿中..." : "投稿する"}
          </button>
        </div>
      )}

      <div>
        {notices.length === 0 && <p style={styles.empty}>お知らせはありません</p>}
        {notices.map((n) => (
          <div key={n.id} style={styles.noticeCard}>
            <p style={styles.noticeText}>{n.text}</p>
            <p style={styles.noticeMeta}>{formatDate(n.createdAt)}</p>
          </div>
        ))}
      </div>

      <button style={styles.backBtn} onClick={onBack}>← 戻る</button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 480, margin: "0 auto", padding: 24 },
  title: { color: "#c9a96e", marginBottom: 20 },
  postBox: { background: "#16213e", borderRadius: 10, padding: 16, marginBottom: 20, border: "1px solid #333" },
  postLabel: { color: "#c9a96e", fontWeight: "bold", marginBottom: 8, fontSize: 14 },
  textarea: {
    width: "100%", padding: 12, borderRadius: 8, border: "1px solid #444",
    background: "#0f3460", color: "#fff", fontSize: 15,
    boxSizing: "border-box", minHeight: 80, resize: "vertical",
  },
  postBtn: {
    width: "100%", padding: "10px 0", background: "#c9a96e", color: "#1a1a2e",
    border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15,
    cursor: "pointer", marginTop: 10,
  },
  empty: { color: "#888" },
  noticeCard: {
    background: "#16213e", borderRadius: 10, padding: 16,
    marginBottom: 10, border: "1px solid #333",
  },
  noticeText: { color: "#fff", margin: "0 0 6px", fontSize: 15, lineHeight: 1.6 },
  noticeMeta: { color: "#888", margin: 0, fontSize: 12 },
  backBtn: { display: "block", marginTop: 12, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
};