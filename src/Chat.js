import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, "messages"), {
      text,
      createdAt: serverTimestamp(),
      email: auth.currentUser.email
    });
    setText("");
  };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ color: '#c9a96e' }}>💬 メインチャット</h3>
      <div style={{
        backgroundColor: '#0f3460',
        borderRadius: '12px',
        padding: '16px',
        height: '400px',
        overflowY: 'scroll',
        marginBottom: '16px'
      }}>
        {messages.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', marginTop: '160px' }}>まだメッセージがありません</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{
            marginBottom: '12px',
            textAlign: msg.email === auth.currentUser.email ? 'right' : 'left'
          }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>{msg.email}</div>
            <div style={{
              display: 'inline-block',
              backgroundColor: msg.email === auth.currentUser.email ? '#c9a96e' : '#16213e',
              color: msg.email === auth.currentUser.email ? '#1a1a2e' : 'white',
              padding: '8px 12px',
              borderRadius: '12px',
              maxWidth: '70%'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="メッセージを入力..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #333',
            backgroundColor: '#0f3460',
            color: 'white'
          }}
        />
        <button onClick={sendMessage} style={{
          padding: '12px 20px',
          backgroundColor: '#c9a96e',
          color: '#1a1a2e',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          送信
        </button>
      </div>
    </div>
  );
}

export default Chat;