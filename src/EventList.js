import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function EventList({ userDoc, isAdmin, onBack }) {
const [events, setEvents] = useState([]);
const [selectedEvent, setSelectedEvent] = useState(null);
const [confirmDelete, setConfirmDelete] = useState(false);
const [editMode, setEditMode] = useState(false);
const [checkedIds, setCheckedIds] = useState([]);
const [confirmBulk, setConfirmBulk] = useState(false);
const [showAddForm, setShowAddForm] = useState(false);
const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", location: "", note: "" });
const [adding, setAdding] = useState(false);

useEffect(() => {
const unsub = onSnapshot(collection(db, "events"), (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
list.sort((a, b) => (a.date > b.date ? 1 : -1));
setEvents(list);
});
return () => unsub();
}, []);

const handleAddEvent = async () => {
if (!newEvent.title || !newEvent.date) return;
setAdding(true);
await addDoc(collection(db, "events"), {
title: newEvent.title,
date: newEvent.date,
time: newEvent.time,
location: newEvent.location,
note: newEvent.note,
attendees: {},
attendeeNames: {},
createdAt: serverTimestamp(),
});
setNewEvent({ title: "", date: "", time: "", location: "", note: "" });
setShowAddForm(false);
setAdding(false);
};

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

const handleDelete = async () => {
await deleteDoc(doc(db, "events", selectedEvent.id));
setConfirmDelete(false);
setSelectedEvent(null);
};

const handleBulkDelete = async () => {
for (const id of checkedIds) {
await deleteDoc(doc(db, "events", id));
}
setCheckedIds([]);
setEditMode(false);
setConfirmBulk(false);
};

const toggleCheck = (id) => {
setCheckedIds((prev) =>
prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
);
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

if (showAddForm) {
return (
<div style={S.container}>
<h2 style={{ color: '#c9a96e', marginBottom: 20 }}>📅 イベント追加</h2>
<div style={S.formGroup}>
<label style={S.label}>タイトル *</label>
<input style={S.input} value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="例：シーシャ会 in 恵比寿" />
</div>
<div style={S.formGroup}>
<label style={S.label}>日付 *</label>
<input style={S.input} type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
</div>
<div style={S.formGroup}>
<label style={S.label}>時間</label>
<input style={S.input} type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
</div>
<div style={S.formGroup}>
<label style={S.label}>場所</label>
<input style={S.input} value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="例：恵比寿" />
</div>
<div style={S.formGroup}>
<label style={S.label}>備考</label>
<textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={newEvent.note} onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })} placeholder="補足情報など" />
</div>
<button style={{ ...S.addBtn, opacity: adding ? 0.6 : 1 }} onClick={handleAddEvent} disabled={adding}>
{adding ? "登録中..." : "登録する"}
</button>
<button style={S.backBtn} onClick={() => setShowAddForm(false)}>← キャンセル</button>
</div>
);
}

if (selectedEvent) {
const goingNames = getNames(selectedEvent, "going");
const notgoingNames = getNames(selectedEvent, "notgoing");
const undecidedNames = getNames(selectedEvent, "undecided");
return (
<div style={S.container}>
<div style={S.header}>
<h2 style={S.title}>📅 {selectedEvent.title}</h2>
{isAdmin && <button style={S.deleteBtn} onClick={() => setConfirmDelete(true)}>削除</button>}
</div>
<div style={S.infoBox}>
<p style={S.infoRow}><span style={S.infoLabel}>日程</span><span style={S.infoValue}>{selectedEvent.date}</span></p>
{selectedEvent.time && <p style={S.infoRow}><span style={S.infoLabel}>時間</span><span style={S.infoValue}>{selectedEvent.time}</span></p>}
{selectedEvent.location && <p style={S.infoRow}><span style={S.infoLabel}>場所</span><span style={S.infoValue}>{selectedEvent.location}</span></p>}
{selectedEvent.note && <p style={S.infoRow}><span style={S.infoLabel}>備考</span><span style={S.infoValue}>{selectedEvent.note}</span></p>}
</div>
<p style={S.label}>あなたの回答：{statusLabel(myStatus)}</p>
<div style={S.btnGroup}>
<button style={{...S.attendBtn, background: myStatus==="going"?"#c9a96e":"#16213e", color: myStatus==="going"?"#1a1a2e":"#fff"}} onClick={() => handleAttend("going")}>参加する</button>
<button style={{...S.attendBtn, background: myStatus==="notgoing"?"#e05555":"#16213e", color:"#fff"}} onClick={() => handleAttend("notgoing")}>参加しない</button>
<button style={{...S.attendBtn, background: myStatus==="undecided"?"#555":"#16213e", color:"#fff"}} onClick={() => handleAttend("undecided")}>未定</button>
</div>
{isAdmin && (
<div style={S.adminSection}>
<p style={S.adminTitle}>参加者リスト（管理人のみ）</p>
<p style={S.listTitle}>参加する（{goingNames.length}人）</p>
{goingNames.map((n) => <p key={n} style={S.name}>・{n}</p>)}
<p style={S.listTitleRed}>参加しない（{notgoingNames.length}人）</p>
{notgoingNames.map((n) => <p key={n} style={S.name}>・{n}</p>)}
<p style={S.listTitleGray}>未定（{undecidedNames.length}人）</p>
{undecidedNames.map((n) => <p key={n} style={S.name}>・{n}</p>)}
</div>
)}
<button style={S.backBtn} onClick={() => setSelectedEvent(null)}>← イベント一覧に戻る</button>
{confirmDelete && (
<div style={S.overlay}>
<div style={S.dialog}>
<p style={S.dialogText}>このイベントを削除しますか？</p>
<div style={S.dialogBtns}>
<button style={S.confirmBtn} onClick={handleDelete}>削除する</button>
<button style={S.cancelBtn} onClick={() => setConfirmDelete(false)}>キャンセル</button>
</div>
</div>
</div>
)}
</div>
);
}

return (
<div style={S.container}>
<div style={S.header}>
<h2 style={S.title}>📅 イベント一覧</h2>
<div style={{ display: 'flex', gap: 8 }}>
{isAdmin && (
<button style={S.addIconBtn} onClick={() => setShowAddForm(true)}>＋ 追加</button>
)}
{isAdmin && (
<button style={editMode ? S.cancelEditBtn : S.editBtn} onClick={() => { setEditMode(!editMode); setCheckedIds([]); }}>
{editMode ? "キャンセル" : "編集"}
</button>
)}
</div>
</div>
{editMode && checkedIds.length > 0 && (
<button style={S.bulkDeleteBtn} onClick={() => setConfirmBulk(true)}>
選択した{checkedIds.length}件を削除
</button>
)}
{events.length === 0 && <p style={S.empty}>イベントはまだありません</p>}
<div>
{events.map((event) => (
<div key={event.id} style={{...S.eventCard, borderColor: checkedIds.includes(event.id) ? "#e05555" : "#333"}}
onClick={() => editMode ? toggleCheck(event.id) : setSelectedEvent(event)}>
<div style={S.eventCardInner}>
{editMode && (
<div style={{...S.checkbox, background: checkedIds.includes(event.id)?"#e05555":"transparent", borderColor: checkedIds.includes(event.id)?"#e05555":"#888"}}>
{checkedIds.includes(event.id) && <span style={{color:"#fff",fontSize:12}}>✓</span>}
</div>
)}
<div style={{flex:1}}>
<p style={S.eventTitle}>{event.title}</p>
<p style={S.eventDate}>📅 {event.date}</p>
{event.time && <p style={S.eventTime}>⏰ {event.time}</p>}
{event.location && <p style={S.eventLocation}>📍 {event.location}</p>}
{event.note && <p style={S.eventNote}>📝 {event.note}</p>}
<p style={S.eventSub}>参加 {countStatus(event,"going")}人 ／ 不参加 {countStatus(event,"notgoing")}人 ／ 未定 {countStatus(event,"undecided")}人</p>
</div>
</div>
</div>
))}
</div>
<button style={S.backBtn} onClick={onBack}>← 戻る</button>
{confirmBulk && (
<div style={S.overlay}>
<div style={S.dialog}>
<p style={S.dialogText}>{checkedIds.length}件のイベントを削除しますか？</p>
<div style={S.dialogBtns}>
<button style={S.confirmBtn} onClick={handleBulkDelete}>削除する</button>
<button style={S.cancelBtn} onClick={() => setConfirmBulk(false)}>キャンセル</button>
</div>
</div>
</div>
)}
</div>
);
}

const S = {
container: { maxWidth: 480, margin: "0 auto", padding: 24 },
header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
title: { color: "#c9a96e", margin: 0 },
editBtn: { background: "none", border: "1px solid #555", color: "#aaa", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
cancelEditBtn: { background: "none", border: "1px solid #888", color: "#888", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
addIconBtn: { background: "#c9a96e", border: "none", color: "#1a1a2e", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold" },
bulkDeleteBtn: { width: "100%", padding: "10px 0", background: "#e05555", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 14, cursor: "pointer", marginBottom: 12 },
deleteBtn: { background: "none", border: "1px solid #e05555", color: "#e05555", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: "bold", fontSize: 13 },
infoBox: { background: "#16213e", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #333" },
infoRow: { display: "flex", gap: 12, margin: "0 0 8px", alignItems: "flex-start" },
infoLabel: { color: "#888", fontSize: 13, width: 40, flexShrink: 0 },
infoValue: { color: "#fff", fontSize: 15 },
label: { color: "#aaa", marginBottom: 12 },
empty: { color: "#888" },
btnGroup: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 },
attendBtn: { width: "100%", padding: "12px 0", border: "1px solid #444", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer" },
adminSection: { background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16 },
adminTitle: { color: "#c9a96e", fontWeight: "bold", marginBottom: 12, fontSize: 13 },
listTitle: { color: "#c9a96e", fontWeight: "bold", marginBottom: 4 },
listTitleRed: { color: "#e05555", fontWeight: "bold", marginBottom: 4 },
listTitleGray: { color: "#888", fontWeight: "bold", marginBottom: 4 },
name: { color: "#ccc", margin: "2px 0", fontSize: 14 },
backBtn: { display: "block", marginTop: 12, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
eventCard: { background: "#16213e", borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer", border: "2px solid" },
eventCardInner: { display: "flex", alignItems: "center", gap: 12 },
checkbox: { width: 22, height: 22, borderRadius: 6, border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
eventTitle: { color: "#fff", margin: "0 0 4px", fontWeight: "bold" },
eventDate: { color: "#c9a96e", margin: "0 0 2px", fontSize: 13 },
eventTime: { color: "#aaa", margin: "0 0 2px", fontSize: 13 },
eventLocation: { color: "#aaa", margin: "0 0 4px", fontSize: 13 },
eventNote: { color: "#aaa", margin: "0 0 4px", fontSize: 13 },
eventSub: { color: "#888", margin: 0, fontSize: 13 },
overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
dialog: { background: "#16213e", borderRadius: 12, padding: 24, width: 280, textAlign: "center", border: "1px solid #333" },
dialogText: { color: "#fff", marginBottom: 20 },
dialogBtns: { display: "flex", gap: 12 },
confirmBtn: { flex: 1, padding: "10px 0", background: "#e05555", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" },
cancelBtn: { flex: 1, padding: "10px 0", background: "#333", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" },
formGroup: { marginBottom: 16 },
input: { width: "100%", padding: "10px 12px", background: "#0f3460", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box" },
addBtn: { width: "100%", padding: "12px 0", background: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginBottom: 12 },
};