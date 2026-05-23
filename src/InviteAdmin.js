import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function InviteAdmin({ onBack }) {
  const [inviteUrl, setInviteUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 20; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    setCreating(true);
    const code = generateCode();
    await addDoc(collection(db, "invites"), {
      code,
      used: false,
      createdAt: serverTimestamp(),
    });
    const url = `${window.location.origin}?invite=${code}`;
    setInviteUrl(url);
    setCreating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert("コピーしました！");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔗 招待URL発行</h2>
      <p style={styles.desc}>新しいメンバーを招待するURLを発行します。</p>

      <button style={styles.createBtn} onClick={handleCreate} disabled={creating}>
        {creating ? "発行中..." : "招待URLを発行する"}
      </button>

      {inviteUrl && (
        <div style={styles.urlBox}>
          <p style={styles.urlLabel}>招待URL</p>
          <p style={styles.urlText}>{inviteUrl}</p>
          <button style={styles.copyBtn} onClick={handleCopy}>
            コピーする
          </button>
        </div>
      )}

      <button style={styles.backBtn} onClick={onBack}>← 戻る</button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 480, margin: "0 auto", padding: 24 },
  title: { color: "#c9a96e", marginBottom: 12 },
  desc: { color: "#888", marginBottom: 24 },
  createBtn: {
    width: "100%", padding: "12px 0", background: "#c9a96e", color: "#1a1a2e",
    border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer",
    marginBottom: 24,
  },
  urlBox: {
    background: "#16213e", borderRadius: 10, padding: 16, marginBottom: 16,
    border: "1px solid #333",
  },
  urlLabel: { color: "#c9a96e", fontWeight: "bold", marginBottom: 8 },
  urlText: {
    color: "#fff", fontSize: 13, wordBreak: "break-all",
    marginBottom: 12, lineHeight: 1.6,
  },
  copyBtn: {
    width: "100%", padding: "10px 0", background: "#0f3460", color: "#c9a96e",
    border: "1px solid #c9a96e", borderRadius: 8, fontWeight: "bold",
    fontSize: 14, cursor: "pointer",
  },
  backBtn: {
    display: "block", marginTop: 12, background: "none", border: "none",
    color: "#888", cursor: "pointer", fontSize: 14,
  },
};