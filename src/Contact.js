import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, updateDoc
} from "firebase/firestore";

export default function Contact({ userDoc, isAdmin }) {
const [posts, setPosts] = useState([]);
const [text, setText] = useState("");
const [sending, setSending] = useState(false);
const [selectedPost, setSelectedPost] = useState(null);
const [replyText, setReplyText] = useState("");
const [replying, setReplying] = useState(false);

useEffect(() => {
const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
const unsub = onSnapshot(q, (snap) => {
setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
});
return () => unsub();
}, []);

const handleSubmit = async () => {
if (!text.trim()) return;
setSending(true);
await addDoc(collection(db, "contacts"), {
text: text.trim(),
uid: userDoc.uid,
nickname: userDoc.nickname,
createdAt: serverTimestamp(),
reply: null,
repliedAt: null,
});
setText("");
setSending(false);
};

const handleReply = async () => {
if (!replyText.trim()) return;
setReplying(true);
await updateDoc(doc(db, "contacts", selectedPost.id), {
reply: replyText.trim(),
repliedAt: serverTimestamp(),
});
setSelectedPost((prev) => ({ ...prev, reply: replyText.trim() }));
setReplyText("");
setReplying(false);
};

const formatDate = (ts) => {
if (!ts || !ts.toDate) return "";
const d = ts.toDate();
return (d.getMonth() + 1) + "/" + d.getDate();
};

const myPosts = posts.filter((p) => p.uid === userDoc.uid);
const visiblePosts = isAdmin ? posts : myPosts;

if (selectedPost) {
return (
<div style={S.container}>
<div style={S.header}>
<h2 style={S.title}>📮 要望・問い合わせ</h2>
</div>
<div style={S.postBox}>
{isAdmin && <p style={S.nickname}>{selectedPost.nickname}</p>}
<p style={S.postText}>{selectedPost.text}</p>
<p style={S.date}>{formatDate(selectedPost.createdAt)}</p>
</div>
{selectedPost.reply ? (
<div style={S.replyBox}>
<p style={S.replyLabel}>📨 管理人からの返信</p>
<p style={S.replyText}>{selectedPost.reply}</p>
<p style={S.date}>{formatDate(selectedPost.repliedAt)}</p>
</div>
) : (
<p style={S.noReply}>まだ返信はありません</p>
)}
{isAdmin && (
<div style={S.replyForm}>
<p style={S.replyLabel}>返信する</p>
<textarea
style={{ ...S.input, height: 80, resize: 'vertical' }}
value={replyText}
onChange={(e) => setReplyText(e.target.value)}
placeholder="返信内容を入力..."
/>
<button
style={{ ...S.submitBtn, opacity: replying ? 0.6 : 1 }}
onClick={handleReply}
disabled={replying}
>
{replying ? "送信中..." : "返信する"}
</button>
</div>
)}
<button style={S.backBtn} onClick={() => setSelectedPost(null)}>← 一覧に戻る</button>
</div>
);
}

return (
<div style={S.container}>
<h2 style={S.title}>📮 要望・問い合わせ</h2>

  {/* 投稿フォーム */}
  <div style={S.formBox}>
    <p style={S.formLabel}>新しい投稿</p>
    <textarea
      style={{ ...S.input, height: 80, resize: 'vertical' }}
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="要望・問い合わせを入力してください"
    />
    <button
      style={{ ...S.submitBtn, opacity: sending ? 0.6 : 1 }}
      onClick={handleSubmit}
      disabled={sending}
    >
      {sending ? "送信中..." : "送信する"}
    </button>
  </div>

  {/* 投稿一覧 */}
  <h3 style={{ color: '#c9a96e', margin: '24px 0 12px' }}>
    {isAdmin ? "全員の投稿" : "自分の投稿"}
  </h3>
  {visiblePosts.length === 0 ? (
    <p style={{ color: '#888' }}>投稿はありません</p>
  ) : (
    visiblePosts.map((p) => (
      <div
        key={p.id}
        style={{ ...S.card, borderColor: p.reply ? '#c9a96e' : '#333', cursor: 'pointer' }}
        onClick={() => setSelectedPost(p)}
      >
        {isAdmin && <p style={S.nickname}>{p.nickname}</p>}
        <p style={S.cardText}>{p.text}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={S.date}>{formatDate(p.createdAt)}</p>
          <span style={{ fontSize: 12, color: p.reply ? '#c9a96e' : '#555' }}>
            {p.reply ? "✅ 返信あり" : "⏳ 未返信"}
          </span>
        </div>
      </div>
    ))
  )}
</div>

);
}

const S = {
container: { maxWidth: 480, margin: "0 auto", padding: 24 },
header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
title: { color: "#c9a96e", margin: "0 0 20px" },
formBox: { background: "#16213e", borderRadius: 12, padding: 16, marginBottom: 8, border: "1px solid #333" },
formLabel: { color: "#c9a96e", fontWeight: "bold", margin: "0 0 10px", fontSize: 14 },
input: { width: "100%", padding: "10px 12px", background: "#0f3460", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" },
submitBtn: { width: "100%", padding: "12px 0", background: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginTop: 10 },
card: { background: "#16213e", borderRadius: 10, padding: 16, marginBottom: 12, border: "2px solid", cursor: "pointer" },
nickname: { color: "#c9a96e", fontSize: 13, margin: "0 0 6px", fontWeight: "bold" },
cardText: { color: "#fff", fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 },
date: { color: "#555", fontSize: 11, margin: 0 },
postBox: { background: "#16213e", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #333" },
postText: { color: "#fff", fontSize: 15, margin: "0 0 8px", lineHeight: 1.6 },
replyBox: { background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #c9a96e" },
replyLabel: { color: "#c9a96e", fontWeight: "bold", margin: "0 0 8px", fontSize: 13 },
replyText: { color: "#fff", fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 },
noReply: { color: "#555", fontSize: 13, marginBottom: 16 },
replyForm: { background: "#16213e", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #333" },
backBtn: { display: "block", marginTop: 12, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
};