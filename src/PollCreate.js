import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PollCreate({ userDoc, onBack }) {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const updateOption = (i, val) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title.trim()) return alert("タイトルを入力してください");
    const filled = options.filter((o) => o.trim());
    if (filled.length < 2) return alert("選択肢を2つ以上入力してください");

    setSending(true);
    await addDoc(collection(db, "polls"), {
      title: title.trim(),
      options: filled.map((label, i) => ({ id: `opt${i}`, label })),
      createdBy: userDoc.uid,
      createdAt: serverTimestamp(),
      status: "open",
    });
    setSending(false);
    setDone(true);
  };

  if (done) return (
    <div style={styles.container}>
      <p style={styles.successMsg}>✅ 投票を作成しました！</p>
      <button style={styles.backBtn} onClick={onBack}>← 戻る</button>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🗳️ 投票作成</h2>

      <label style={styles.label}>投票タイトル</label>
      <input
        style={styles.input}
        placeholder="例：6月シーシャ会の日程"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label style={styles.label}>選択肢</label>
      {options.map((opt, i) => (
        <div key={i} style={styles.optionRow}>
          <input
            style={{ ...styles.input, flex: 1, marginBottom: 0 }}
            placeholder={`選択肢 ${i + 1}`}
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
          />
          {options.length > 2 && (
            <button style={styles.removeBtn} onClick={() => removeOption(i)}>✕</button>
          )}
        </div>
      ))}

      <button style={styles.addBtn} onClick={addOption}>＋ 選択肢を追加</button>
      <button style={styles.submitBtn} onClick={handleSubmit} disabled={sending}>
        {sending ? "作成中..." : "投票を作成する"}
      </button>
      <button style={styles.backBtn} onClick={onBack}>← 戻る</button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 480, margin: "0 auto", padding: 24 },
  title: { color: "#c9a96e", marginBottom: 20 },
  label: { display: "block", color: "#aaa", marginBottom: 6, marginTop: 16 },
  input: {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #444", background: "#16213e", color: "#fff",
    fontSize: 15, boxSizing: "border-box", marginBottom: 8,
  },
  optionRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  removeBtn: {
    background: "none", border: "none", color: "#888",
    fontSize: 18, cursor: "pointer", padding: "0 4px",
  },
  addBtn: {
    display: "block", marginTop: 4, marginBottom: 20,
    background: "none", border: "1px solid #555", color: "#aaa",
    padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14,
  },
  submitBtn: {
    width: "100%", padding: "12px 0", background: "#c9a96e", color: "#1a1a2e",
    border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 16, cursor: "pointer",
  },
  backBtn: {
    display: "block", marginTop: 12, background: "none", border: "none",
    color: "#888", cursor: "pointer", fontSize: 14,
  },
  successMsg: { color: "#c9a96e", fontSize: 18, marginBottom: 20 },
};