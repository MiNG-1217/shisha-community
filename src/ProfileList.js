import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function ProfileList({ userDoc, onBack }) {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map((d) => d.data());
      list.sort((a, b) => a.nickname?.localeCompare(b.nickname));
      setMembers(list);
    });
    return () => unsub();
  }, []);

  if (selected) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.avatar}>
              {selected.nickname?.[0] || "?"}
            </div>
            <div>
              <h2 style={styles.name}>{selected.nickname}</h2>
              {selected.threads && <p style={styles.threads}>{selected.threads}</p>}
            </div>
          </div>

          <div style={styles.infoGrid}>
            {selected.area && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>居住エリア</p>
                <p style={styles.infoValue}>{selected.area}</p>
              </div>
            )}
            {selected.frequentArea && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>よく行くエリア</p>
                <p style={styles.infoValue}>{selected.frequentArea}</p>
              </div>
            )}
            {selected.shops && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>よく行くお店</p>
                <p style={styles.infoValue}>{selected.shops}</p>
              </div>
            )}
            {selected.flavor && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>好きな系統</p>
                <p style={styles.infoValue}>{selected.flavor}</p>
              </div>
            )}
            {selected.workShop && (
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>勤務店舗</p>
                <p style={styles.infoValue}>{selected.workShop}</p>
              </div>
            )}
          </div>

          {selected.bio && (
            <div style={styles.bioBox}>
              <p style={styles.bioText}>{selected.bio}</p>
            </div>
          )}
        </div>

        <button style={styles.backBtn} onClick={() => setSelected(null)}>
          ← メンバー一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👥 メンバー一覧</h2>
      <div style={styles.grid}>
        {members.map((member) => (
          <div
            key={member.uid}
            style={styles.memberCard}
            onClick={() => setSelected(member)}
          >
            <div style={styles.avatarSmall}>
              {member.nickname?.[0] || "?"}
            </div>
            <div>
              <p style={styles.memberName}>{member.nickname}</p>
              {member.area && <p style={styles.memberArea}>{member.area}</p>}
              {member.isStaff && <p style={styles.memberStaff}>🌿 店員</p>}
            </div>
          </div>
        ))}
      </div>
      <button style={styles.backBtn} onClick={onBack}>← 戻る</button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: "0 auto", padding: 24 },
  title: { color: "#c9a96e", marginBottom: 20 },
  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20,
  },
  memberCard: {
    background: "#16213e", borderRadius: 10, padding: 16,
    cursor: "pointer", border: "1px solid #333",
    display: "flex", alignItems: "center", gap: 12,
  },
  avatarSmall: {
    width: 44, height: 44, borderRadius: "50%",
    background: "#c9a96e", color: "#1a1a2e",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "bold", fontSize: 18, flexShrink: 0,
  },
  memberName: { color: "#fff", margin: 0, fontWeight: "bold", fontSize: 15 },
  memberArea: { color: "#888", margin: "2px 0 0", fontSize: 12 },
  memberStaff: { color: "#c9a96e", margin: "2px 0 0", fontSize: 12 },
  card: {
    background: "#16213e", borderRadius: 12, padding: 24,
    border: "1px solid #333", marginBottom: 16,
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  avatar: {
    width: 64, height: 64, borderRadius: "50%",
    background: "#c9a96e", color: "#1a1a2e",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "bold", fontSize: 28, flexShrink: 0,
  },
  name: { color: "#fff", margin: "0 0 4px", fontSize: 20 },
  threads: { color: "#888", margin: "0 0 4px", fontSize: 14 },
  staffBadge: {
    background: "#0f3460", color: "#c9a96e", fontSize: 12,
    padding: "2px 8px", borderRadius: 6, border: "1px solid #c9a96e",
  },
  infoGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16,
  },
  infoItem: {
    background: "#0f3460", borderRadius: 8, padding: 12,
  },
  infoLabel: { color: "#888", margin: "0 0 4px", fontSize: 12 },
  infoValue: { color: "#fff", margin: 0, fontSize: 14 },
  bioBox: {
    background: "#0f3460", borderRadius: 8, padding: 12,
  },
  bioText: { color: "#fff", margin: 0, fontSize: 14, lineHeight: 1.6 },
  backBtn: {
    display: "block", marginTop: 12, background: "none", border: "none",
    color: "#888", cursor: "pointer", fontSize: 14,
  },
};