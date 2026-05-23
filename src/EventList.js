import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function EventList({ userDoc, isAdmin, onBack }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.date > b.date ? 1 : -1));
      setEvents(list);
    });
    return () => unsub();
  }, []);

  const handleAttend = async (status) => {
    const ref = doc(db, "events", selectedEvent.id);
    await updateDoc(ref, {
      [`attendees.${userDoc.uid}`]: status,
      [`attendeeNames.${userDoc.uid}`]: userDoc.nickname,
    });
    setSelectedEvent((prev) => ({
      ...prev,
      attendees: { ...prev.attendees, [userDoc.uid]: status },
      attendeeNames: { ...prev.attendeeNames, [userDoc.uid]: userDoc.nickname },
    }));
  };

  const myStatus = selectedEvent?.attendees?.[userDoc.uid];

  const statusLabel = (s) => {
    if (s === "going") return "参加する";
    if (s === "notgoing") return "参加しない";
    if (s === "undecided") return "未定";
    return "未回答";
  };

  const getNames = (event, status) => {
    const attendees = event.attendees || {};
    const names = event.attendeeNames || {};
    return Object.entries(attendees)
      .filter(([, v]) => v === status)
      .map(([uid]) => names[uid] || uid);
  };

  const countStatus = (event, status) =>
    Object.values(event.attendees || {}).filter((v) => v === status).length;

  if (selectedEvent) {
    const goingNames = getNames(selectedEvent, "going");
    const notgoingNames = getNames(selectedEvent, "notgoing");
    const undecidedNames = getNames(selectedEvent, "undecided");

    return (
      <div style={styles.container}>
        <h2 style={styles.title}>📅 {selectedEvent.title}</h2>
        <p style={styles.date}>日程：{selectedEvent.date}</p>
        <p style={styles.label}>あなたの回答：{statusLabel(myStatus)}</p>
        <div style={styles.btnGroup}>
          <button
            style={{ ...styles.attendBtn, background: myStatus === "going" ? "#c9a96e" : "#16213e", color: myStatus === "going" ? "#1a1a2e" : "#fff" }}
            onClick={() => handleAttend("going")}
          >
            参加する
          </button>
          <button
            style={{ ...styles.attendBtn, background: myStatus === "notgoing" ? "#e05555" : "#16213e", color: "#fff" }}
            onClick={() => handleAttend("notgoing")}
          >
            参加しない
          </button>
          <button
            style={{ ...styles.attendBtn, background: myStatus === "undecided" ? "#555" : "#16213e", color: "#fff" }}
            onClick={() => handleAttend("undecided")}
          >
            未定
          </button>
        </div>
        {isAdmin && (
          <div style={styles.adminSection}>
            <p style={styles.adminTitle}>参加者リスト（管理人のみ）</p>
            <div style={styles.listSection}>
              <p style={styles.listTitle}>参加する（{goingNames.length}人）</p>
              {goingNames.map((name) => <p key={name} style={styles.name}>・{name}</p>)}
            </div>
            <div style={styles.listSection}>
              <p style={styles.listTitleRed}>参加しない（{notgoingNames.length}人）</p>
              {notgoingNames.map((name) => <p key={name} style={styles.name}>・{name}</p>)}
            </div>
            <div style={styles.listSection}>
              <p style={styles.listTitleGray}>未定（{undecidedNames.length}人）</p>
              {undecidedNames.map((name) => <p key={name} style={styles.name}>・{name}</p>)}
            </div>
          </div>
        )}
        <button style={styles.backBtn} onClick={() => setSelectedEvent(null)}>
          ← イベント一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📅 イベント一覧</h2>
      {events.length === 0 && <p style={styles.empty}>イベントはまだありません</p>}
      <div>
        {events.map((event) => (
          <div key={event.id} style={styles.eventCard} onClick={() => setSelectedEvent(event)}>
            <p style={styles.eventTitle}>{event.title}</p>
            <p style={styles.eventDate}>📅 {event.date}</p>
            <p style={styles.eventSub}>
              参加 {countStatus(event, "going")}人 ／
              不参加 {countStatus(event, "notgoing")}人 ／
              未定 {countStatus(event, "undecided")}人
            </p>
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
  date: { color: "#fff", fontSize: 16, marginBottom: 16 },
  label: { color: "#aaa", marginBottom: 12 },
  empty: { color: "#888" },
  btnGroup: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 },
  attendBtn: {
    width: "100%", padding: "12px 0", border: "1px solid #444",
    borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer",
  },
  adminSection: { background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16 },
  adminTitle: { color: "#c9a96e", fontWeight: "bold", marginBottom: 12, fontSize: 13 },
  listSection: { marginBottom: 12 },
  listTitle: { color: "#c9a96e", fontWeight: "bold", marginBottom: 4 },
  listTitleRed: { color: "#e05555", fontWeight: "bold", marginBottom: 4 },
  listTitleGray: { color: "#888", fontWeight: "bold", marginBottom: 4 },
  name: { color: "#ccc", margin: "2px 0", fontSize: 14 },
  backBtn: { display: "block", marginTop: 12, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
  eventCard: { background: "#16213e", borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer", border: "1px solid #333" },
  eventTitle: { color: "#fff", margin: "0 0 4px", fontWeight: "bold" },
  eventDate: { color: "#c9a96e", margin: "0 0 4px", fontSize: 13 },
  eventSub: { color: "#888", margin: 0, fontSize: 13 },
};