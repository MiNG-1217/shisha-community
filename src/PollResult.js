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

  const handleConfirm = async (opt) => {
    setConfirming(true);
    try {
      await addDoc(collection(db, "events"), {
        title: selectedPoll.title,
        date: opt.label,
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
        <p style={styles.successMsg}>✅ イベントを確定しました！</p>
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
        <div>
          {counts.map((opt) => (
            <div key={opt.id} style={styles.optionRow}>
              <div style={styles.optionInfo}>
                <span style={styles.optionLabel}>{opt.label}</span>
                <span style={styles.optionCount}>{opt.count}票</span>
              </div>
              <div style={styles.barBg}>
                <div style={{
                  height: "8px",
                  borderRadius: "4px",
                  width: votes.length > 0 ? (opt.count / votes.length * 100) + "%" : "0%",
                  background: opt.count === max && max > 0 ? "#c9a96e" : "#444",
                }} />
              </div>
              {selectedPoll.status === "open" && (
                <button style={styles.confirmBtn} onClick={() => handleConfirm(opt)} disabled={confirming}>
                  この日程で確定
                </button>
              )}
            </div>
          ))}
        </div>
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
  empty: { color: "#888" },
  optionRow: { background: "#16213e", borderRadius: 10, padding: 16, marginBottom: 12, border: "1px solid #333" },
  optionInfo: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  optionLabel: { color: "#fff", fontWeight: "bold" },
  optionCount: { color: "#c9a96e", fontWeight: "bold" },
  barBg: { background: "#0f3460", borderRadius: 4, height: 8, marginBottom: 12 },
  confirmBtn: { width: "100%", padding: "10px 0", background: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer" },
  closedMsg: { color: "#c9a96e", marginTop: 12 },
  backBtn: { display: "block", marginTop: 12, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
  pollCard: { background: "#16213e", borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer", border: "1px solid #333" },
  pollTitle: { color: "#fff", margin: "0 0 4px", fontWeight: "bold" },
  pollSub: { color: "#888", margin: 0, fontSize: 13 },
  successMsg: { color: "#c9a96e", fontSize: 18, marginBottom: 20 },
};