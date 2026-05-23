import { useState } from "react";
import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function ProfileSetup({ userDoc, onDone }) {
  const [threads, setThreads] = useState("");
  const [area, setArea] = useState("");
  const [frequentArea, setFrequentArea] = useState("");
  const [shops, setShops] = useState("");
  const [flavor, setFlavor] = useState("");
  const [bio, setBio] = useState("");
  const [workShop, setWorkShop] = useState("");
  const [isStaff, setIsStaff] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateDoc(doc(db, "users", userDoc.uid), {
      threads,
      area,
      frequentArea,
      shops,
      flavor,
      bio,
      workShop: isStaff ? workShop : "",
      isStaff,
      profileDone: true,
    });
    setSaving(false);
    onDone();
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.box}>
        <h2 style={styles.title}>🌿 プロフィール設定</h2>
        <p style={styles.sub}>あとで変更できます</p>

        <label style={styles.label}>Threadsアカウント</label>
        <input style={styles.input} placeholder="@username" value={threads} onChange={(e) => setThreads(e.target.value)} />

        <label style={styles.label}>居住エリア</label>
        <input style={styles.input} placeholder="例：大阪府" value={area} onChange={(e) => setArea(e.target.value)} />

        <label style={styles.label}>よく行くエリア</label>
        <input style={styles.input} placeholder="例：梅田、難波" value={frequentArea} onChange={(e) => setFrequentArea(e.target.value)} />

        <label style={styles.label}>よく行くお店</label>
        <input style={styles.input} placeholder="例：スモーク東京、シーシャバー梅田" value={shops} onChange={(e) => setShops(e.target.value)} />

        <label style={styles.label}>好きな系統</label>
        <input style={styles.input} placeholder="例：フルーツ系、ミント強め" value={flavor} onChange={(e) => setFlavor(e.target.value)} />

        <label style={styles.label}>一言</label>
        <textarea style={styles.textarea} placeholder="よろしくお願いします！" value={bio} onChange={(e) => setBio(e.target.value)} />

        <div style={styles.checkRow}>
          <input type="checkbox" id="isStaff" checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} />
          <label htmlFor="isStaff" style={styles.checkLabel}>シーシャ店員です</label>
        </div>

        {isStaff && (
          <>
            <label style={styles.label}>勤務店舗</label>
            <input style={styles.input} placeholder="例：スモーク東京" value={workShop} onChange={(e) => setWorkShop(e.target.value)} />
          </>
        )}

        <button style={styles.btn} onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存して始める"}
        </button>

        <button style={styles.skipBtn} onClick={onDone}>スキップ</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh", backgroundColor: "#1a1a2e",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: "#16213e", padding: 32, borderRadius: 12,
    width: "100%", maxWidth: 480,
  },
  title: { color: "#c9a96e", marginBottom: 4, textAlign: "center" },
  sub: { color: "#888", marginBottom: 24, textAlign: "center" },
  label: { display: "block", color: "#aaa", marginBottom: 6, marginTop: 16, fontSize: 14 },
  input: {
    width: "100%", padding: 12, borderRadius: 8,
    border: "1px solid #333", backgroundColor: "#0f3460", color: "white",
    boxSizing: "border-box", fontSize: 15,
  },
  textarea: {
    width: "100%", padding: 12, borderRadius: 8,
    border: "1px solid #333", backgroundColor: "#0f3460", color: "white",
    boxSizing: "border-box", fontSize: 15, minHeight: 80, resize: "vertical",
  },
  checkRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 20 },
  checkLabel: { color: "#aaa", fontSize: 15 },
  btn: {
    width: "100%", padding: 12, backgroundColor: "#c9a96e", color: "#1a1a2e",
    border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 16,
    cursor: "pointer", marginTop: 24,
  },
  skipBtn: {
    display: "block", width: "100%", marginTop: 12, background: "none",
    border: "none", color: "#888", cursor: "pointer", fontSize: 14, textAlign: "center",
  },
};