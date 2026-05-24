import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, doc, getDoc } from "firebase/firestore";

function Chat() {
  const [mode, setMode] = useState("group");
  const [messages, setMessages] = useState([]);
  const [dmMessages, setDmMessages] = useState([]);
  const [text, setText] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs
        .map((d) => d.data())
        .filter((m) => m.uid !== auth.currentUser.uid);
      setMembers(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedMember) return;
    const dmId = [auth.currentUser.uid, selectedMember.uid].sort().join("_");
    const q = query(collection(db, "dms", dmId, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, (snapshot) => {
      setDmMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [selectedMember]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    if (mode === "group") {
      await addDoc(collection(db, "messages"), {
        text,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
      });
    } else {
      const dmId = [auth.currentUser.uid, selectedMember.uid].sort().join("_");
      await addDoc(collection(db, "dms", dmId, "messages"), {
        text,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
      });
    }
    setText("");
  };

  const currentUser = auth.currentUser;
  if (mode === "dm" && selectedMember) {
    return (
      <div style={{ padding: "24px" }}>
        <button onClick={() => { setMode("group"); setSelectedMember(null); }}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 16 }}>
          ← 戻る
        </button>
        <h3 style={{ color: "#c9a96e", marginBottom: 16 }}>
          {selectedMember.iconUrl ? (
            <img src={selectedMember.iconUrl} alt="icon" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", marginRight: 8, verticalAlign: "middle" }} />
          ) : (
            <span style={{ display: "inline-block", width: 28, height: 28, borderRadius: "50%", background: "#c9a96e", color: "#1a1a2e", textAlign: "center", lineHeight: "28px", fontSize: 14, marginRight: 8, verticalAlign: "middle" }}>
              {selectedMember.nickname?.[0] || "?"}
            </span>
          )}
          {selectedMember.nickname} へのDM
        </h3>
        <div style={{ backgroundColor: "#0f3460", borderRadius: "12px", padding: "16px", height: "400px", overflowY: "scroll", marginBottom: "16px" }}>
          {dmMessages.length === 0 && (
            <p style={{ color: "#888", textAlign: "center", marginTop: "160px" }}>まだメッセージがありません</p>
          )}
          {dmMessages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: "12px", textAlign: msg.uid === currentUser.uid ? "right" : "left" }}>
              <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>{msg.email}</div>
              <div style={{
                display: "inline-block",
                backgroundColor: msg.uid === currentUser.uid ? "#c9a96e" : "#16213e",
                color: msg.uid === currentUser.uid ? "#1a1a2e" : "white",
                padding: "8px 12px", borderRadius: "12px", maxWidth: "70%"
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input type="text" placeholder="メッセージを入力..." value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#0f3460", color: "white" }} />
          <button onClick={sendMessage} style={{ padding: "12px 20px", backgroundColor: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>送信</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode("group")} style={{
          padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "bold",
          backgroundColor: mode === "group" ? "#c9a96e" : "#16213e", color: mode === "group" ? "#1a1a2e" : "#888"
        }}>💬 グループ</button>
        <button onClick={() => setMode("dm")} style={{
          padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "bold",
          backgroundColor: mode === "dm" ? "#c9a96e" : "#16213e", color: mode === "dm" ? "#1a1a2e" : "#888"
        }}>✉️ DM</button>
      </div>

      {mode === "group" && (
        <div>
          <h3 style={{ color: "#c9a96e" }}>💬 グループチャット</h3>
          <div style={{ backgroundColor: "#0f3460", borderRadius: "12px", padding: "16px", height: "400px", overflowY: "scroll", marginBottom: "16px" }}>
            {messages.length === 0 && (
              <p style={{ color: "#888", textAlign: "center", marginTop: "160px" }}>まだメッセージがありません</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} style={{ marginBottom: "12px", textAlign: msg.uid === currentUser.uid ? "right" : "left" }}>
                <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>{msg.email}</div>
                <div style={{
                  display: "inline-block",
                  backgroundColor: msg.uid === currentUser.uid ? "#c9a96e" : "#16213e",
                  color: msg.uid === currentUser.uid ? "#1a1a2e" : "white",
                  padding: "8px 12px", borderRadius: "12px", maxWidth: "70%"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="text" placeholder="メッセージを入力..." value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#0f3460", color: "white" }} />
            <button onClick={sendMessage} style={{ padding: "12px 20px", backgroundColor: "#c9a96e", color: "#1a1a2e", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>送信</button>
          </div>
        </div>
      )}

      {mode === "dm" && !selectedMember && (
        <div>
          <h3 style={{ color: "#c9a96e", marginBottom: 16 }}>✉️ DMする相手を選ぶ</h3>
          {members.map((member) => (
            <div key={member.uid} onClick={() => setSelectedMember(member)}
              style={{ backgroundColor: "#16213e", borderRadius: 10, padding: 16, marginBottom: 10, cursor: "pointer", border: "1px solid #333", display: "flex", alignItems: "center", gap: 12 }}>
              {member.iconUrl ? (
                <img src={member.iconUrl} alt="icon" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#c9a96e", color: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 18 }}>
                  {member.nickname?.[0] || "?"}
                </div>
              )}
              <p style={{ color: "#fff", margin: 0, fontWeight: "bold" }}>{member.nickname}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Chat;
