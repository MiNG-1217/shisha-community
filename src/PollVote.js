import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, onSnapshot, doc, setDoc, getDoc, serverTimestamp,
} from "firebase/firestore";

export default function PollVote({ userDoc, onBack }) {
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selected, setSelected] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "polls"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.status === "open");
      setPolls(list);
    });
    return () => unsub();
  }, []);

  const openPoll = async (poll) => {
    setSelectedPoll(poll);
    setSelected([]);
    setDone(false);
    const ref = doc(db, "polls", poll.id, "votes", userDoc.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setMyVote(snap.data());
      setSelected(snap.data().selectedOptions);
    } else {
      setMyVote(null);
    }
  };

  const toggleOption = (optId) => {
    setSelected((prev) =>
      prev.includes(optId)
        ? prev.filter((o) => o !== optId)
        : [...prev, optId]
    );
  };

  const handleVote = async () => {
    if (selected.length === 0) {
      alert("選択肢を選んでください");
      return;
    }
    setSending(true);
    try {
      await setDoc(
        doc(db, "polls", selectedPoll.id, "votes", userDoc.uid),
        {
          uid: userDoc.uid,
          nickname: userDoc.nickname,
          selectedOptions: selected,
          votedAt: serverTimestamp(),
        }
      );
      setMyVote({ selectedOptions: selected });
      setDone(true);
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました");
    }
    setSending(false);
  };

  if (done) {
    return (
      <div style={styles.container}>
        <p style={styles.successMsg}>✅ 投票しました！</p>
        <button
          style={styles.backBtn}
          onClick={() => {
            setDone(false);
            setSelectedPoll(null);
          }}
        >
          ← 投票一覧に戻る
        </button>
      </div>
    );
  }

  if (selectedPoll) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>🗳️ {selectedPoll.title}</h2>
        {myVote && (
          <p style={styles.voted}>✅ 投票済みです（変更可能）</p>
        )}
        <p style={styles.label}>選択肢を選んでください（複数選択可）</p>
        <div>
          {selectedPoll.options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid",
                  fontSize: "15px",
                  cursor: "pointer",
                  textAlign: "left",
                  background: isSelected ? "#c9a96e" : "#16213e",
                  color: isSelected ? "#1a1a2e" : "#fff",
                  borderColor: isSelected ? "#c9a96e" : "#444",
                }}
              >
                {isSelected ? "✓ " : ""}{opt.label}
              </button>
            );
          })}
        </div>
        <button
          style={styles.submitBtn}
          onClick={handleVote}
          disabled={sending}
        >
          {sending ? "送信中..." : "投票する"}
        </button>
        <button
          style={styles.backBtn}
          onClick={() => setSelectedPoll(null)}
        >
          ← 投票一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🗳️ 投票一覧</h2>
      {polls.length === 0 && (
        <p style={styles.empty}>現在進行中の投票はありません</p>
      )}
      <div>
        {polls.map((poll) => (
          <div
            key={poll.id}
            style={styles.pollCard}
            onClick={() => openPoll(poll)}
          >
            <p style={styles.pollTitle}>{poll.title}</p>
            <p style={styles.pollSub}>{poll.options.length}つの選択肢 →</p>
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
  label: { color: "#aaa", marginBottom: 12 },
  voted: { color: "#c9a96e", marginBottom: 12 },
  empty: { color: "#888" },
  submitBtn: {
    width: "100%",
    padding: "12px 0",
    background: "#c9a96e",
    color: "#1a1a2e",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
    marginTop: 8,
  },
  backBtn: {
    display: "block",
    marginTop: 12,
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    fontSize: 14,
  },
  pollCard: {
    background: "#16213e",
    borderRadius: 10,
    padding: "16px 20px",
    marginBottom: 12,
    cursor: "pointer",
    border: "1px solid #333",
  },
  pollTitle: { color: "#fff", margin: "0 0 4px", fontWeight: "bold" },
  pollSub: { color: "#888", margin: 0, fontSize: 13 },
  successMsg: { color: "#c9a96e", fontSize: 18, marginBottom: 20 },
};