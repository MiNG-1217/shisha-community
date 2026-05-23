import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, doc, getDocs, updateDoc, addDoc, serverTimestamp,
} from "firebase/firestore";

export default function PollResult({ onBack }) {
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [votes, setVotes] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "polls"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPolls(list);
    });
    return () => unsub();
  }, []);

  const openPoll = async (poll) => {
    setSelectedPoll(poll);
    setDone(false);
    setSelectedOpt(null);
    setTime("");
    setLocation("");
    const snap = await getDocs(collection(db, "polls", poll.id, "votes"));
    setVotes(snap.docs.map((d) => d.data()));
  };

  const countVotes = () => {
    if (!selectedPoll) return [];
    return selectedPoll.options.map((opt) => ({
      ...opt,
      count: votes.filter((v) => v.selectedOptions.includes(opt.id)).length,
    }));
  };

  const handleConfirm = async () => {
    if (!selectedOpt) return;
    setConfirming(true);
    try {
      await addDoc(collection(db, "events"), {
        title: selectedPoll.title,
        date: selectedOpt.label,
        time: time.trim(),
        location: location.trim(),
        createdFromPoll: selectedPoll.id,
        createdAt: serverTimestamp(),
        attendees: {},
      });
      await updateDoc(doc(db, "polls", selectedPoll.id), { status: "closed" });
      setDone(true);
    } catch (e) {
      alert("エラーが発生しました");
    }
    setConfirming(false);
  };

  if (done) {
    return (
      <div style={styles.container}>
        <p style={styles.successMsg}>イベントを確定しました！</p>
        <button style={styles.backBtn} onClick={() => { setDone(false); setSelectedPoll(null); }}>
          ← 投票一覧に戻る
        </button>
      </div>
    );
  }

  if (selectedPoll) {
    const counts = countVotes();
    const max = Math.max(...counts.map((c) => c.count));
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>📊 {selectedPoll.title}</h2>
        <p style={styles.label}>投票数：{votes.length}人</p>

        <p style={styles.sectionLabel}>日程を選んでください</p>
        <div>
          {counts.map((opt) => (
            <div key={opt.id} style={{
              ...styles.optionRow,
              borderColor: selectedOpt?.id === opt.id ? "#c9a96e" : "#333",
            }}
              onClick={() => selectedPoll.status === "open" && setSelectedOpt(opt)}
            >
              <div style={styles.optionInfo}>
                <span style={styles.optionLabel}>{opt.label}</span>
                <span style={styles.optionCount}>{opt.count}票</span>
              </div>
              <div style={styles.barBg}>
                <div style={{
                  height: "8px", borderRadius: "4px",
                  width: votes.length > 0 ? (opt.count / votes.length * 100) + "%" : "0%",
                  background: opt.count === max && max > 0 ? "#c9a96e" : "#444",
                }} />
              </div>
            </div>
          ))}
        </div>

        {selectedPoll.status === "open" && (
          <div style={styles.detailBox}>
            <p style={styles.sectionLabel}>時間・場所（任意）</p>
            <label style={styles.inputLabel}>時間</label>
            <input
              style={styles.input}
              placeholder="例：19:00〜"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <label style={styles.inputLabel}>場所</label>
            <input
              style={styles.input}
              placeholder="例：渋谷 スモーク東京"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button
              style={{
                ...styles.confirmBtn,
                opacity: selectedOpt ? 1 : 0.5,
              }}
              onClick={handleConfirm}
              disabled={confirming || !selectedOpt}
            >
              {confirming ? "確定中..." : "この日程で確定する"}
            </button>
          </div>
        )}

        {selectedPoll.status === "closed" && (
          <p style={styles.closedMsg}>この投票は確定済みです</p>
        )}
        <button style={styles.backBtn} onClick={() => setSelectedPoll(null)}>
          ← 投票一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 投票結果・イベント確定</h2>
      {polls.length === 0 && <p style={styles.empty}>投票がありません</p>}
      <div>
        {polls.map((poll) => (
          <div key={poll.id} style={styles.pollCard} onClick={() => openPoll(poll)}>
            <p style={styles.pollTitle}>{poll.title}</p>
            <p style={styles.pollSub}>{poll.status === "open" ? "🟢 進行中" : "✅ 確定済み"}</p>
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
  label: { color: "#aaa", marginBottom: 16 },
  sectionLabel: { color: "#c9a96e", fontWeight: "bold", marginBottom: 10, marginTop: 16 },
  empty: { color: "#888" },
  optionRow: {
    background: "#16213e", borderRadius: 10, padding: 16,
    marginBottom: 12, border: "2px solid", cursor: "pointer",
  },
  optionInfo: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  optionLabel: { color: "#fff", fontWeight: "bold" },
  optionCount: { color: "#c9a96e", fontWeight: "bold" },
  barBg: { background: "#0f3460", borderRadius: 4, height: 8 },
  detailBox: { background: "#16213e", borderRadius: 10, padding: 16, marginTop: 16, border: "1px solid #333" },
  inputLabel: { display: "block", color: "#aaa", fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #444", background: "#0f3460", color: "#fff",
    fontSize: 15, boxSizing: "border-box",
  },
  confirmBtn: {
    width: "100%", padding: "12px 0", background: "#c9a96e", color: "#1a1a2e",
    border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15,
    cursor: "pointer", marginTop: 16,
  },
  closedMsg: { color: "#c9a96e", marginTop: 12 },
  backBtn: { display: "block", marginTop: 12, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
  pollCard: { background: "#16213e", borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer", border: "1px solid #333" },
  pollTitle: { color: "#fff", margin: "0 0 4px", fontWeight: "bold" },
  pollSub: { color: "#888", margin: 0, fontSize: 13 },
  successMsg: { color: "#c9a96e", fontSize: 18, marginBottom: 20 },
};