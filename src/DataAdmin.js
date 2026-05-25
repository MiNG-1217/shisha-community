import { useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const AREAS = ["関西", "東海", "東北", "北海道", "九州"];

const TARGETS = [
{ key: "messages", label: "💬 メインチャット" },
{ key: "area_関西", label: "🗾 エリア：関西" },
{ key: "area_東海", label: "🗾 エリア：東海" },
{ key: "area_東北", label: "🗾 エリア：東北" },
{ key: "area_北海道", label: "🗾 エリア：北海道" },
{ key: "area_九州", label: "🗾 エリア：九州" },
{ key: "dms", label: "✉️ DM（全員分）" },
{ key: "contacts", label: "📮 要望・問い合わせ" },
{ key: "events", label: "📅 イベント" },
{ key: "polls", label: "🗳️ 投票" },
{ key: "notices", label: "📢 お知らせ" },
];

export default function DataAdmin() {
const [confirming, setConfirming] = useState(null);
const [deleting, setDeleting] = useState(null);
const [done, setDone] = useState(null);

const handleDelete = async (key) => {
setDeleting(key);
setConfirming(null);
if (key.startsWith("area_")) {
const area = key.replace("area_", "");
const snap = await getDocs(collection(db, "areas", area, "messages"));
for (const d of snap.docs) {
await deleteDoc(doc(db, "areas", area, "messages", d.id));
}
} else if (key === "dms") {
const dmSnap = await getDocs(collection(db, "dms"));
for (const dmDoc of dmSnap.docs) {
const msgSnap = await getDocs(collection(db, "dms", dmDoc.id, "messages"));
for (const m of msgSnap.docs) {
await deleteDoc(doc(db, "dms", dmDoc.id, "messages", m.id));
}
await deleteDoc(doc(db, "dms", dmDoc.id));
}
} else {
const snap = await getDocs(collection(db, key));
for (const d of snap.docs) {
await deleteDoc(doc(db, key, d.id));
}
}
setDeleting(null);
setDone(key);
setTimeout(() => setDone(null), 3000);
};

return (
<div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
<h2 style={{ color: "#e05555", margin: "0 0 8px" }}>🗑️ データ管理</h2>
<p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>管理人のみ表示。削除したデータは復元できません。</p>
{TARGETS.map((t) => (
<div key={t.key} style={{ background: "#16213e", borderRadius: 10, padding: 16, marginBottom: 12, border: "1px solid #333" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<p style={{ color: "#fff", margin: 0, fontWeight: "bold" }}>{t.label}</p>
{deleting === t.key ? (
<span style={{ color: "#888", fontSize: 13 }}>削除中...</span>
) : done === t.key ? (
<span style={{ color: "#c9a96e", fontSize: 13 }}>✅ 完了</span>
) : (
<button
style={{ background: "none", border: "1px solid #e05555", color: "#e05555", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
onClick={() => setConfirming(t.key)}>
リセット
</button>
)}
</div>
</div>
))}
{confirming && (
<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
<div style={{ background: "#16213e", borderRadius: 12, padding: 24, width: 280, textAlign: "center", border: "1px solid #333" }}>
<p style={{ color: "#fff", marginBottom: 8, fontWeight: "bold" }}>本当に削除しますか？</p>
<p style={{ color: "#e05555", marginBottom: 20, fontSize: 13 }}>この操作は取り消せません</p>
<div style={{ display: "flex", gap: 12 }}>
<button style={{ flex: 1, padding: "10px 0", background: "#e05555", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}
onClick={() => handleDelete(confirming)}>削除する</button>
<button style={{ flex: 1, padding: "10px 0", background: "#333", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}
onClick={() => setConfirming(null)}>キャンセル</button>
</div>
</div>
</div>
)}
</div>
);
}