import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

const EMOJI_LIST = [
"🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
"🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦆",
"🦅","🦉","🦇","🐺","🐴","🦄","🐢","🐍","🦎","🦖",
"🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬",
"🐳","🦈","🐊","🪶","🌵","🎄","🌲","🌳","🌴","🪵",
"🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁",
"🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🪻",
"🪷","🍄","🌰","🫘","🫛","🥜","🍇","🍈","🍉","🍊",
"🍋","🍌","🍍","🥭","🍎","🍏","🍐","🥥","🫒","🚬",
"💨","🌬️","🔥","🧊","🫧","⚗️","🏺","☕","🍵","🥃"
];

export default function ProfileList({ userDoc, onBack }) {
const [members, setMembers] = useState([]);
const [selected, setSelected] = useState(null);
const [editing, setEditing] = useState(false);
const [threads, setThreads] = useState("");
const [area, setArea] = useState("");
const [frequentArea, setFrequentArea] = useState("");
const [shops, setShops] = useState("");
const [flavor, setFlavor] = useState("");
const [bio, setBio] = useState("");
const [workShop, setWorkShop] = useState("");
const [isStaff, setIsStaff] = useState(false);
const [iconFile, setIconFile] = useState(null);
const [iconPreview, setIconPreview] = useState(null);
const [saving, setSaving] = useState(false);
const [myEmoji, setMyEmoji] = useState("");

useEffect(() => {
const unsub = onSnapshot(collection(db, "users"), (snap) => {
const list = snap.docs.map((d) => d.data());
list.sort((a, b) => a.nickname?.localeCompare(b.nickname));
setMembers(list);
});
return () => unsub();
}, []);

const usedEmojis = members.filter((m) => m.uid !== userDoc?.uid).map((m) => m.myEmoji).filter(Boolean);

const startEdit = () => {
setThreads(selected.threads || "");
setArea(selected.area || "");
setFrequentArea(selected.frequentArea || "");
setShops(selected.shops || "");
setFlavor(selected.flavor || "");
setBio(selected.bio || "");
setWorkShop(selected.workShop || "");
setIsStaff(selected.isStaff || false);
setIconPreview(selected.iconUrl || null);
setMyEmoji(selected.myEmoji || "");
setIconFile(null);
setEditing(true);
};

const handleIconChange = (e) => {
const file = e.target.files[0];
if (!file) return;
setIconFile(file);
setIconPreview(URL.createObjectURL(file));
};

const uploadIcon = async () => {
if (!iconFile) return null;
const formData = new FormData();
formData.append("file", iconFile);
formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
const data = await res.json();
return data.secure_url;
};

const handleSave = async () => {
setSaving(true);
const iconUrl = await uploadIcon();
await updateDoc(doc(db, "users", selected.uid), {
threads, area, frequentArea, shops, flavor, bio,
workShop: isStaff ? workShop : "",
isStaff,
myEmoji,
...(iconUrl && { iconUrl }),
});
setSaving(false);
setEditing(false);
setSelected((prev) => ({
...prev, threads, area, frequentArea, shops, flavor, bio,
workShop: isStaff ? workShop : "",
isStaff,
myEmoji,
...(iconUrl && { iconUrl }),
}));
};

if (editing) {
return (
<div style={styles.container}>
<div style={styles.card}>
<h2 style={styles.title}>✏️ プロフィール編集</h2>
<div style={styles.iconWrap}>
{iconPreview ? (
<img src={iconPreview} alt="icon" style={styles.iconImg} />
) : (
<div style={styles.iconPlaceholder}>📷</div>
)}
<label style={styles.iconBtn}>
画像を変更
<input type="file" accept="image/*" onChange={handleIconChange} style={{ display: "none" }} />
</label>
</div>

<label style={styles.label}>マイ絵文字を選ぶ</label>
<p style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>他のメンバーが使っている絵文字は選べません</p>
<div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
{EMOJI_LIST.map((emoji) => {
const isUsed = usedEmojis.includes(emoji);
const isSelected = myEmoji === emoji;
return (
<button key={emoji} onClick={() => !isUsed && setMyEmoji(emoji)} style={{ fontSize: 24, padding: 4, borderRadius: 8, border: isSelected ? "2px solid #c9a96e" : "2px solid transparent", background: isUsed ? "#333" : "#0f3460", cursor: isUsed ? "not-allowed" : "pointer", opacity: isUsed ? 0.3 : 1 }}>
{emoji}
</button>
);
})}
</div>
{myEmoji && <p style={{ color: "#c9a96e", marginBottom: 8 }}>選択中：{myEmoji}</p>}

<label style={styles.label}>Threadsアカウント</label>
<input style={styles.input} value={threads} onChange={(e) => setThreads(e.target.value)} />
<label style={styles.label}>居住エリア</label>
<input style={styles.input} value={area} onChange={(e) => setArea(e.target.value)} />
<label style={styles.label}>よく行くエリア</label>
<input style={styles.input} value={frequentArea} onChange={(e) => setFrequentArea(e.target.value)} />
<label style={styles.label}>よく行くお店</label>
<input style={styles.input} value={shops} onChange={(e) => setShops(e.target.value)} />
<label style={styles.label}>好きな系統</label>
<input style={styles.input} value={flavor} onChange={(e) => setFlavor(e.target.value)} />
<label style={styles.label}>一言</label>
<textarea style={styles.textarea} value={bio} onChange={(e) => setBio(e.target.value)} />
<div style={styles.checkRow}>
<input type="checkbox" id="isStaff" checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} />
<label htmlFor="isStaff" style={styles.checkLabel}>シーシャ店員です</label>
</div>
{isStaff && (
<>
<label style={styles.label}>勤務店舗</label>
<input style={styles.input} value={workShop} onChange={(e) => setWorkShop(e.target.value)} />
</>
)}
<button style={styles.btn} onClick={handleSave} disabled={saving}>
{saving ? "保存中..." : "保存する"}
</button>
<button style={styles.skipBtn} onClick={() => setEditing(false)}>キャンセル</button>
</div>
</div>
);
}

if (selected) {
const isMe = userDoc?.uid === selected.uid;
return (
<div style={styles.container}>
<div style={styles.card}>
<div style={styles.cardHeader}>
{selected.iconUrl ? (
<img src={selected.iconUrl} alt="icon" style={styles.avatarImg} />
) : (
<div style={styles.avatar}>{selected.nickname?.[0] || "?"}</div>
)}
<div>
<h2 style={styles.name}>{selected.nickname}</h2>
{selected.myEmoji && <p style={{ fontSize: 28, margin: "4px 0 0" }}>{selected.myEmoji}</p>}
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
{isMe && (
<button style={styles.editBtn} onClick={startEdit}>
✏️ プロフィールを編集
</button>
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
<div key={member.uid} style={styles.memberCard} onClick={() => setSelected(member)}>
{member.iconUrl ? (
<img src={member.iconUrl} alt="icon" style={styles.avatarSmallImg} />
) : (
<div style={styles.avatarSmall}>{member.nickname?.[0] || "?"}</div>
)}
<div>
<p style={styles.memberName}>{member.nickname} {member.myEmoji || ""}</p>
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
grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
memberCard: { background: "#16213e", borderRadius: 10, padding: 16, cursor: "pointer", border: "1px solid #333", display: "flex", alignItems: "center", gap: 12 },
avatarSmall: { width: 44, height: 44, borderRadius: "50%", background: "#c9a96e", color: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 18, flexShrink: 0 },
avatarSmallImg: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
memberName: { color: "#fff", margin: 0, fontWeight: "bold", fontSize: 15 },
memberArea: { color: "#888", margin: "2px 0 0", fontSize: 12 },
memberStaff: { color: "#c9a96e", margin: "2px 0 0", fontSize: 12 },
card: { background: "#16213e", borderRadius: 12, padding: 24, border: "1px solid #333", marginBottom: 16 },
cardHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
avatar: { width: 64, height: 64, borderRadius: "50%", background: "#c9a96e", color: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 28, flexShrink: 0 },
avatarImg: { width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
name: { color: "#fff", margin: "0 0 4px", fontSize: 20 },
threads: { color: "#888", margin: "0 0 4px", fontSize: 14 },
infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
infoItem: { background: "#0f3460", borderRadius: 8, padding: 12 },
infoLabel: { color: "#888", margin: "0 0 4px", fontSize: 12 },
infoValue: { color: "#fff", margin: 0, fontSize: 14 },
bioBox: { background: "#0f3460", borderRadius: 8, padding: 12 },
bioText: { color: "#fff", margin: 0, fontSize: 14, lineHeight: 1.6 },
editBtn: { width: "100%", marginTop: 16, padding: 10, background: "#0f3460", color: "#c9a96e", border: "1px solid #c9a96e", borderRadius: 8, cursor: "pointer", fontSize: 14 },
backBtn: { display: "block", marginTop: 12, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14 },
iconWrap: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 },
iconImg: { width: 90, height: 90, borderRadius: "50%", objectFit: "cover", marginBottom: 8 },
iconPlaceholder: { width: 90, height: 90, borderRadius: "50%", backgroundColor: "#0f3460", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 8 },
iconBtn: { padding: "6px 16px", backgroundColor: "#0f3460", color: "#c9a96e", borderRadius: 8, cursor: "pointer", fontSize: 14, border: "1px solid #c9a96e" },
label: { display: "block", color: "#aaa", marginBottom: 6, marginTop: 16, fontSize: 14 },
input: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", backgroundColor: "#0f3460", color: "white", boxSizing: "border-box", fontSize: 15 },
textarea: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #333", backgroundColor: "#0f3460", color: "white", boxSizing: "border-box", fontSize: 15, minHeight: 80, resize: "vertical" },
checkRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 20 },
checkLabel: { color: "#aaa", fontSize: 15 },
btn: { width: "100%", padding: 12, backgroundColor: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: 8, fontWeight: "bold", fontSize: 16, cursor: "pointer", marginTop: 24 },
skipBtn: { display: "block", width: "100%", marginTop: 12, background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, textAlign: "center" },
};