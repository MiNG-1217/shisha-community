import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { useUser } from "./hooks/useUser";
import Chat from "./Chat";
import PollCreate from "./PollCreate";
import PollVote from "./PollVote";
import PollResult from "./PollResult";
import EventList from "./EventList";
import InviteAdmin from "./InviteAdmin";
import Register from "./Register";
import ProfileSetup from "./ProfileSetup";
import ProfileList from "./ProfileList";
import MemberAdmin from "./MemberAdmin";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const { user, userDoc, isAdmin, loading } = useUser();

  const inviteCode = new URLSearchParams(window.location.search).get("invite");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "events"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(list);
    });
    return () => unsub();
  }, [user]);

  const myEvents = events.filter(
    (e) => e.attendees?.[user?.uid] === "going"
  ).sort((a, b) => a.date > b.date ? 1 : -1);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError("");
    } catch (err) {
      setError("メールアドレスまたはパスワードが間違っています");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setPage("dashboard");
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#c9a96e' }}>読み込み中...</p>
      </div>
    );
  }

  if (!user && inviteCode) {
    return <Register inviteCode={inviteCode} onDone={() => window.location.href = "/"} />;
  }

  if (!user) {
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

  if (user && userDoc && userDoc.profileDone === false) {
    return <ProfileSetup userDoc={userDoc} onDone={() => window.location.href = "/"} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <div style={{ backgroundColor: '#16213e', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#c9a96e', margin: 0 }}>🌿 Shisha Community</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && <span style={{ color: '#c9a96e', fontSize: 12, border: '1px solid #c9a96e', borderRadius: 6, padding: '2px 8px' }}>管理人</span>}
          <button onClick={handleLogout} style={{ backgroundColor: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}>ログアウト</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
        {['dashboard', 'chat', 'events', 'members', 'pollvote', 'pollresult', 'poll', 'invite', 'memberadmin'].map((p) => (
          (p === 'dashboard' || p === 'chat' || p === 'events' || p === 'members' || p === 'pollvote' || isAdmin) && (
            <button key={p} onClick={() => setPage(p)} style={{
              padding: '12px 20px',
              backgroundColor: page === p ? '#c9a96e' : 'transparent',
              color: page === p ? '#1a1a2e' : '#888',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 13,
            }}>
              {p === 'dashboard' ? '🏠 ホーム'
                : p === 'chat' ? '💬 チャット'
                : p === 'events' ? '📅 イベント'
                : p === 'members' ? '👥 メンバー'
                : p === 'pollvote' ? '🗳️ 投票'
                : p === 'pollresult' ? '📊 投票結果'
                : p === 'poll' ? '✏️ 投票作成'
                : p === 'invite' ? '🔗 招待'
                : '⚙️ メンバー管理'}
            </button>
          )
        ))}
      </div>

      {page === 'dashboard' && (
        <div style={{ padding: '24px' }}>
          <h3 style={{ color: '#c9a96e' }}>ダッシュボード</h3>
          <p style={{ color: '#888', marginBottom: 20 }}>ようこそ、{userDoc?.nickname} さん</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ color: '#c9a96e', margin: '0 0 8px' }}>💬 チャット</h4>
              <p style={{ color: '#888', margin: 0 }}>未読メッセージなし</p>
            </div>
            <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ color: '#c9a96e', margin: '0 0 8px' }}>📅 直近イベント</h4>
              {myEvents.length === 0 ? (
                <p style={{ color: '#888', margin: 0 }}>参加予定なし</p>
              ) : (
                myEvents.slice(0, 2).map((e) => (
                  <div key={e.id} style={{ marginBottom: 6 }}>
                    <p style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 'bold' }}>{e.title}</p>
                    <p style={{ color: '#c9a96e', margin: 0, fontSize: 12 }}>{e.date}</p>
                  </div>
                ))
              )}
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
      {page === 'events' && <EventList userDoc={userDoc} isAdmin={isAdmin} onBack={() => setPage('dashboard')} />}
      {page === 'members' && <ProfileList userDoc={userDoc} onBack={() => setPage('dashboard')} />}
      {page === 'pollvote' && <PollVote userDoc={userDoc} onBack={() => setPage('dashboard')} />}
      {page === 'pollresult' && <PollResult userDoc={userDoc} onBack={() => setPage('dashboard')} />}
      {page === 'poll' && <PollCreate userDoc={userDoc} onBack={() => setPage('dashboard')} />}
      {page === 'invite' && <InviteAdmin onBack={() => setPage('dashboard')} />}
      {page === 'memberadmin' && <MemberAdmin onBack={() => setPage('dashboard')} />}
    </div>
  );
}

export default App;