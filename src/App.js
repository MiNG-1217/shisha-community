import { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import Chat from "./Chat";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const handleLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      setError("");
    } catch (err) {
      setError("メールアドレスまたはパスワードが間違っています");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setPage("dashboard");
  };

  if (user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <div style={{ backgroundColor: '#16213e', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#c9a96e', margin: 0 }}>🌿 Shisha Community</h2>
          <button onClick={handleLogout} style={{ backgroundColor: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>ログアウト</button>
        </div>
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #333' }}>
          {['dashboard', 'chat'].map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{
              padding: '12px 24px',
              backgroundColor: page === p ? '#c9a96e' : 'transparent',
              color: page === p ? '#1a1a2e' : '#888',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              {p === 'dashboard' ? '🏠 ホーム' : '💬 チャット'}
            </button>
          ))}
        </div>
        {page === 'dashboard' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ color: '#c9a96e' }}>ダッシュボード</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ color: '#c9a96e', margin: '0 0 8px' }}>💬 チャット</h4>
                <p style={{ color: '#888', margin: 0 }}>未読メッセージなし</p>
              </div>
              <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ color: '#c9a96e', margin: '0 0 8px' }}>📅 直近イベント</h4>
                <p style={{ color: '#888', margin: 0 }}>イベントなし</p>
              </div>
              <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ color: '#c9a96e', margin: '0 0 8px' }}>🗳️ 投票</h4>
                <p style={{ color: '#888', margin: 0 }}>進行中の投票なし</p>
              </div>
              <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ color: '#c9a96e', margin: '0 0 8px' }}>📣 お知らせ</h4>
                <p style={{ color: '#888', margin: 0 }}>新着なし</p>
              </div>
            </div>
          </div>
        )}
        {page === 'chat' && <Chat />}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#16213e', padding: '40px', borderRadius: '12px', width: '320px', textAlign: 'center' }}>
        <h1 style={{ color: '#c9a96e', marginBottom: '8px' }}>🌿 Shisha Community</h1>
        <p style={{ color: '#888', marginBottom: '24px' }}>ログイン</p>
        <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f3460', color: 'white', boxSizing: 'border-box' }} />
        <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0f3460', color: 'white', boxSizing: 'border-box' }} />
        {error && <p style={{ color: '#ff6b6b', marginBottom: '12px' }}>{error}</p>}
        <button onClick={handleLogin}
          style={{ width: '100%', padding: '12px', backgroundColor: '#c9a96e', color: '#1a1a2e', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
          ログイン
        </button>
      </div>
    </div>
  );
}

export default App;