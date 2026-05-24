import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, doc } from "firebase/firestore";

const AREAS = ["関西", "東海", "東北", "北海道", "九州"];

function Chat({ onUnreadChange }) {
const [mode, setMode] = useState("group");
const [messages, setMessages] = useState([]);
const [dmMessages, setDmMessages] = useState([]);
const [areaMessages, setAreaMessages] = useState([]);
const [text, setText] = useState("");
const [members, setMembers] = useState([]);
const [selectedMember, setSelectedMember] = useState(null);
const [selectedArea, setSelectedArea] = useState(null);
const [unreadGroup, setUnreadGroup] = useState(0);
const [unreadDm, setUnreadDm] = useState({});
const currentUser = auth.currentUser;

useEffect(() => {
const unsub = onSnapshot(collection(db, "users"), (snap) => {
const list = snap.docs.map((d) => d.data()).filter((m) => m.uid !== currentUser.uid);
setMembers(list);
});
return () => unsub();
}, []);

useEffect(() => {
const q = query(collection(db, "messages"), orderBy("createdAt"));
const unsub = onSnapshot(q, (snapshot) => {
const msgs = snapshot.docs.map((d) => ({ id: [d.id](http://d.id/), ...d.data() }));
setMessages(msgs);
if (mode !== "group") {
const unread = msgs.filter((m) => m.uid !== currentUser.uid && !m.readBy?.includes(currentUser.uid)).length;
setUnreadGroup(unread);
} else {
setUnreadGroup(0);
}
});
return () => unsub();
}, [mode]);

useEffect(() => {
if (!selectedArea) return;
const q = query(collection(db, "areas", selectedArea, "messages"), orderBy("createdAt"));
const unsub = onSnapshot(q, (snapshot) => {
setAreaMessages(snapshot.docs.map((d) => ({ id: [d.id](http://d.id/), ...d.data() })));
});
return () => unsub();
}, [selectedArea]);

useEffect(() => {
members.forEach((member) => {
const dmId = [currentUser.uid, member.uid].sort().join("_");
const q = query(collection(db, "dms", dmId, "messages"), orderBy("createdAt"));
onSnapshot(q, (snapshot) => {
const msgs = snapshot.docs.map((d) => ({ id: [d.id](http://d.id/), ...d.data() }));
const unread = msgs.filter((m) => m.uid !== currentUser.uid && !m.readBy?.includes(currentUser.uid)).length;
setUnreadDm((prev) => ({ ...prev, [member.uid]: unread }));
});
});
}, [members]);

useEffect(() => {
const totalDm = Object.values(unreadDm).reduce((a, b) => a + b, 0);
if (onUnreadChange) onUnreadChange(unreadGroup + totalDm);
}, [unreadGroup, unreadDm]);

useEffect(() => {
if (!selectedMember) return;
const dmId = [currentUser.uid, selectedMember.uid].sort().join("_");
const q = query(collection(db, "dms", dmId, "messages"), orderBy("createdAt"));
const unsub = onSnapshot(q, (snapshot) => {
setDmMessages(snapshot.docs.map((d) => ({ id: [d.id](http://d.id/), ...d.data() })));
});
return () => unsub();
}, [selectedMember]);

const markGroupRead = () => {
messages.forEach(async (msg) => {
if (msg.uid !== currentUser.uid && !msg.readBy?.includes(currentUser.uid)) {
await updateDoc(doc(db, "messages", [msg.id](http://msg.id/)), { readBy: [...(msg.readBy || []), currentUser.uid] });
}
});
setUnreadGroup(0);
};

const markDmRead = (member) => {
const dmId = [currentUser.uid, member.uid].sort().join("_");
dmMessages.forEach(async (msg) => {
if (msg.uid !== currentUser.uid && !msg.readBy?.includes(currentUser.uid)) {
await updateDoc(doc(db, "dms", dmId, "messages", [msg.id](http://msg.id/)), { readBy: [...(msg.readBy || []), currentUser.uid] });
}
});
setUnreadDm((prev) => ({ ...prev, [member.uid]: 0 }));
};

const sendMessage = async () => {
if (!text.trim()) return;
if (mode === "group") {
await addDoc(collection(db, "messages"), { text, createdAt: serverTimestamp(), uid: currentUser.uid, email: currentUser.email, readBy: [currentUser.uid] });
} else if (mode === "area" && selectedArea) {
await addDoc(collection(db, "areas", selectedArea, "messages"), { text, createdAt: serverTimestamp(), uid: currentUser.uid, email: currentUser.email });
} else {
const dmId = [currentUser.uid, selectedMember.uid].sort().join("_");
await addDoc(collection(db, "dms", dmId, "messages"), { text, createdAt: serverTimestamp(), uid: currentUser.uid, email: currentUser.email, readBy: [currentUser.uid] });
}
setText("");
};

if (mode === "dm" && selectedMember) {
return (
<div style={{ padding: "24px" }}>
<button onClick={() => { setMode("dm"); setSelectedMember(null); }} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← 戻る</button>
<h3 style={{ color: "#c9a96e", marginBottom: 16 }}>
{selectedMember.iconUrl ? (
<img src={selectedMember.iconUrl} alt="icon" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", marginRight: 8, verticalAlign: "middle" }} />
) : (
<span style={{ display: "inline-block", width: 28, height: 28, borderRadius: "50%", background: "#c9a96e", color: "#1a1a2e", textAlign: "center", lineHeight: "28px", fontSize: 14, marginRight: 8, verticalAlign: "middle" }}>{selectedMember.nickname?.[0] || "?"}</span>
)}
{selectedMember.nickname} へのDM
</h3>
<div style={{ backgroundColor: "#0f3460", borderRadius: "12px", padding: "16px", height: "400px", overflowY: "scroll", marginBottom: "16px" }}>
{dmMessages.length === 0 && <p style={{ color: "#888", textAlign: "center", marginTop: "160px" }}>まだメッセージがありません</p>}
{dmMessages.map((msg) => (
<div key={[msg.id](http://msg.id/)} style={{ marginBottom: "12px", textAlign: msg.uid === currentUser.uid ? "right" : "left" }}>
<div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>{msg.email}</div>
<div style={{ display: "inline-block", backgroundColor: msg.uid === currentUser.uid ? "#c9a96e" : "#16213e", color: msg.uid === currentUser.uid ? "#1a1a2e" : "white", padding: "8px 12px", borderRadius: "12px", maxWidth: "70%" }}>{msg.text}</div>
</div>
))}
</div>
<div style={{ display: "flex", gap: "8px" }}>
<input type="text" placeholder="メッセージを入力..." value={text} onChange={(e) => setText(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#0f3460", color: "white" }} />
<button onClick={sendMessage} style={{ padding: "12px 20px", backgroundColor: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>送信</button>
</div>
</div>
);
}

if (mode === "area" && selectedArea) {
return (
<div style={{ padding: "24px" }}>
<button onClick={() => setSelectedArea(null)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>← 戻る</button>
<h3 style={{ color: "#c9a96e", marginBottom: 16 }}>🗾 {selectedArea}スレッド</h3>
<div style={{ backgroundColor: "#0f3460", borderRadius: "12px", padding: "16px", height: "400px", overflowY: "scroll", marginBottom: "16px" }}>
{areaMessages.length === 0 && <p style={{ color: "#888", textAlign: "center", marginTop: "160px" }}>まだメッセージがありません</p>}
{areaMessages.map((msg) => (
<div key={[msg.id](http://msg.id/)} style={{ marginBottom: "12px", textAlign: msg.uid === currentUser.uid ? "right" : "left" }}>
<div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>{msg.email}</div>
<div style={{ display: "inline-block", backgroundColor: msg.uid === currentUser.uid ? "#c9a96e" : "#16213e", color: msg.uid === currentUser.uid ? "#1a1a2e" : "white", padding: "8px 12px", borderRadius: "12px", maxWidth: "70%" }}>{msg.text}</div>
</div>
))}
</div>
<div style={{ display: "flex", gap: "8px" }}>
<input type="text" placeholder="メッセージを入力..." value={text} onChange={(e) => setText(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#0f3460", color: "white" }} />
<button onClick={sendMessage} style={{ padding: "12px 20px", backgroundColor: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>送信</button>
</div>
</div>
);
}

return (
<div style={{ padding: "24px" }}>
<div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
<button onClick={() => { setMode("group"); markGroupRead(); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "bold", position: "relative", backgroundColor: mode === "group" ? "#c9a96e" : "#16213e", color: mode === "group" ? "#1a1a2e" : "#888" }}>
💬 メイン
{unreadGroup > 0 && <span style={{ position: "absolute", top: -6, right: -6, background: "#ff4444", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadGroup}</span>}
</button>
<button onClick={() => setMode("dm")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "bold", position: "relative", backgroundColor: mode === "dm" ? "#c9a96e" : "#16213e", color: mode === "dm" ? "#1a1a2e" : "#888" }}>
✉️ DM
{Object.values(unreadDm).reduce((a, b) => a + b, 0) > 0 && <span style={{ position: "absolute", top: -6, right: -6, background: "#ff4444", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{Object.values(unreadDm).reduce((a, b) => a + b, 0)}</span>}
</button>
</div>

  {mode === "group" && (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ color: "#c9a96e", margin: 0 }}>💬 メインチャット</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {AREAS.map((area) => (
            <button key={area} onClick={() => { setMode("area"); setSelectedArea(area); }} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #c9a96e", background: "none", color: "#c9a96e", cursor: "pointer", fontSize: 12 }}>{area}</button>
          ))}
        </div>
      </div>
      <div style={{ backgroundColor: "#0f3460", borderRadius: "12px", padding: "16px", height: "400px", overflowY: "scroll", marginBottom: "16px" }}>
        {messages.length === 0 && <p style={{ color: "#888", textAlign: "center", marginTop: "160px" }}>まだメッセージがありません</p>}
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: "12px", textAlign: msg.uid === currentUser.uid ? "right" : "left" }}>
            <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>{msg.email}</div>
            <div style={{ display: "inline-block", backgroundColor: msg.uid === currentUser.uid ? "#c9a96e" : "#16213e", color: msg.uid === currentUser.uid ? "#1a1a2e" : "white", padding: "8px 12px", borderRadius: "12px", maxWidth: "70%" }}>{msg.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input type="text" placeholder="メッセージを入力..." value={text} onChange={(e) => setText(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#0f3460", color: "white" }} />
        <button onClick={sendMessage} style={{ padding: "12px 20px", backgroundColor: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>送信</button>
      </div>
    </div>
  )}

  {mode === "area" && !selectedArea && (
    <div>
      <h3 style={{ color: "#c9a96e", marginBottom: 16 }}>🗾 エリアスレッド</h3>
      {AREAS.map((area) => (
        <div key={area} onClick={() => setSelectedArea(area)} style={{ backgroundColor: "#16213e", borderRadius: 10, padding: 16, marginBottom: 10, cursor: "pointer", border: "1px solid #333", display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ color: "#fff", margin: 0, fontWeight: "bold", fontSize: 16 }}>🗾 {area}</p>
        </div>
      ))}
    </div>
  )}

  {mode === "dm" && !selectedMember && (
    <div>
      <h3 style={{ color: "#c9a96e", marginBottom: 16 }}>✉️ DMする相手を選ぶ</h3>
      {members.map((member) => (
        <div key={member.uid} onClick={() => { setSelectedMember(member); markDmRead(member); }} style={{ backgroundColor: "#16213e", borderRadius: 10, padding: 16, marginBottom: 10, cursor: "pointer", border: "1px solid #333", display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          {member.iconUrl ? (
            <img src={member.iconUrl} alt="icon" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#c9a96e", color: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 18 }}>{member.nickname?.[0] || "?"}</div>
          )}
          <p style={{ color: "#fff", margin: 0, fontWeight: "bold" }}>{member.nickname}</p>
          {unreadDm[member.uid] > 0 && <span style={{ marginLeft: "auto", background: "#ff4444", color: "white", borderRadius: "50%", width: 22, height: 22, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadDm[member.uid]}</span>}
        </div>
      ))}
    </div>
  )}
</div>

);
}

export default Chat;
