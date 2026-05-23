import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function MemberAdmin({ onBack }) {
  const [members, setMembers] = useState([]);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map((d) => d.data());
      list.sort((a, b) => a.nickname?.localeCompare(b.nickname));
      setMembers(list);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (uid) => {
    await deleteDoc(doc(db, "users", uid));
    setConfirming(null);
  };

  const handleToggleAdmin = async (member) => {
    const newRole = member.role === "admin" ? "member" : "admin";
    await updateDoc(doc(db, "users", member.uid), { role: newRole });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚙️ メンバー管理</h2>
      <p style={styles.desc}>全{members.length}人</p>

      {members.map((member) => (
        <div key={member.uid} style={styles.row}>
          <div style={styles.avatar}>{member.nickname?.[0] || "?"}</div>
          <div style={styles.info}>
            <p style={styles.name}>{member.nickname}</p>
            <p style={styles.email}>{member.email}</p>
          </div>
          <div style={styles.actions}>
            <button
              style={{
                ...styles.roleBtn,
                background: member.role === "admin" ? "#c9a96e" : "#0f3460",
                color: member.role === "admin" ? "#1a1a2e" : "#c9a96e",
              }}
              onClick={() => handleToggleAdmin(member)}
            >
              {member.role === "admin" ? "管理人" : "メンバー"}
            </button>
            <button
              style={styles.deleteBtn}
              onClick={() => setConfirming(member.uid)}
            >
              削除
            </button>
          </div>
        </div>
      ))}

      {confirming && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <p style={styles.dialogText}>本当に削除しますか？</p>
            <div style={styles.dialogBtns}>
              <button style={styles.confirmBtn} onClick={() => handleDelete(confirming)}>削除する</button>
              <button style={styles.cancelBtn} onClick={() => setConfirming(null)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      <button style={styles.backBtn} onClick={onBack}>← 戻る</button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: "0 auto", padding: 24 },
  title: { color: "#c9a96e", marginBottom: 4 },
  desc: { color: "#888", marginBottom: 20 },
  row: {
    background: "#16213e", borderRadius: 10, padding: 16,
    marginBottom: 10, border: "1px solid #333",
    display: "flex", alignItems: "center", gap: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "#c9a96e", color: "#1a1a2e",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "bold", fontSize: 16, flexShrink: 0,
  },
  info: { flex: 1 },
  name: { color: "#fff", margin: 0, fontWeight: "bold" },
  email: { color: "#888", margin: "2px 0 0", fontSize: 12 },
  actions: { display: "flex", gap: 8, flexShrink: 0 },
  roleBtn: {
    padding: "6px 12px", borderRadius: 6, border: "1px solid #c9a96e",
    fontWeight: "bold", fontSize: 12, cursor: "pointer",
  },
  deleteBtn: {
    padding: "6px 12px", borderRadius: 6, border: "1px solid #e05555",
    background: "none", color: "#e05555", fontWeight: "bold",
    fontSize: 12, cursor: "pointer",
  },
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 100,
  },
  dialog: {
    background: "#16213e", borderRadius: 12, padding: 24,
    width: 280, textAlign: "center", border: "1px solid #333",
  },
  dialogText: { color: "#fff", marginBottom: 20 },
  dialogBtns: { display: "flex", gap: 12 },
  confirmBtn: {
    flex: 1, padding: "10px 0", background: "#e05555", color: "#fff",
    border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer",
  },
  cancelBtn: {
    flex: 1, padding: "10px 0", background: "#333", color: "#fff",
    border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer",
  },
  backBtn: {
    display: "block", marginTop: 12, background: "none", border: "none",
    color: "#888", cursor: "pointer", fontSize: 14,
  },
};