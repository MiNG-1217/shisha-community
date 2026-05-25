import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
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
import Notices from "./Notices";
import Contact from "./Contact";
import DataAdmin from "./DataAdmin";

function App() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [page, setPage] = useState("dashboard");
const [subPage, setSubPage] = useState(null);
const [notices, setNotices] = useState([]);
const [chatUnread, setChatUnread] = useState(0);
const [upcomingEvent, setUpcomingEvent] = useState(null);
const [activities, setActivities] = useState([]);
const { user, userDoc, isAdmin, loading } = useUser();

const inviteCode = new URLSearchParams(window.location.search).get("invite");

useEffect(() => {
if (!user) return;
const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
const unsub = onSnapshot(q, (snap) => {
setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
});
return () => unsub();
}, [user]);

useEffect(() => {
if (!user) return;
const today = new Date().toISOString().split("T")[0];
const q = query(
collection(db, "events"),
where("date", ">=", today),
orderBy("date", "asc")
);
const unsub = onSnapshot(q, (snap) => {
const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
setUpcomingEvent(list.length > 0 ? list[0] : null);
});
return () => unsub();
}, [user]);

useEffect(() => {
if (!user) return;
const sources = [
{ col: "events", icon: "📅", label: (d) => `イベント「${d.title}」が登録されました` },
{ col: "polls", icon: "🗳️", label: (d) => `投票「${d.title || d.question || ""}」が開始されました` },
{ col: "users", icon: "👤", label: (d) => `新しいメンバー「${d.nickname || ""}」が参加しました` },
];
const all = [];
let loaded = 0;
const unsubList = sources.map(({ col, icon, label }, idx) => {
const q = query(collection(db, col), orderBy("createdAt", "desc"));
return onSnapshot(q, (snap) => {
const items = snap.docs.map((d) => ({
id: col + d.id,
icon,
text: label({ id: d.id, ...d.data() }),
createdAt: d.data().createdAt,
}));
all[idx] = items;
loaded++;
if (loaded >= sources.length) {
const merged = all
.flat()
.filter((a) => a.text && !a.text.includes("「」") && !a.text.includes("undefined"));
merged.sort((a, b) => {
const ta = a.createdAt?.toDate?.() || new Date(0);
const tb = b.createdAt?.toDate?.() || new Date(0);
return tb - ta;
});
setActivities(merged.slice(0, 10));
}
});
});
return () => unsubList.forEach((u) => u());
}, [user]);

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
setSubPage(null);
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

const formatDate = (ts) => {
if (!ts || !ts.toDate) return "";
const d = ts.toDate();
return (d.getMonth() + 1) + "/" + d.getDate();
};

const renderPage = () => {
if (page === 'dashboard') {
return (
<div style={{ padding: '24px', maxWidth: 600, margin: '0 auto' }}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
<h3 style={{ color: '#c9a96e', margin: 0 }}>📢 お知らせ</h3>
{isAdmin && subPage !== 'noticepost' && (
<button
style={{ background: '#c9a96e', border: 'none', color: '#1a1a2e', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}
onClick={() => setSubPage('noticepost')}>投稿</button>
)}
</div>
{subPage === 'noticepost' && (
<Notices userDoc={userDoc} isAdmin={isAdmin} onBack={() => setSubPage(null)} />
)}
{subPage !== 'noticepost' && (
<div style={{ marginBottom: 24 }}>
{notices.length === 0 ? (
<p style={{ color: '#888' }}>新着なし</p>
) : (
notices.slice(0, 3).map((n) => (
<div key={n.id} style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '16px', marginBottom: 10, border: '1px solid #333' }}>
<p style={{ color: '#fff', margin: '0 0 6px', fontSize: 14, lineHeight: 1.6 }}>{n.text}</p>
<p style={{ color: '#888', margin: 0, fontSize: 12 }}>{formatDate(n.createdAt)}</p>
</div>
))
)}
</div>
)}
<h3 style={{ color: '#c9a96e', margin: '0 0 12px' }}>📅 直近イベント</h3>
{upcomingEvent ? (
<div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '16px', marginBottom: 24, border: '1px solid #c9a96e', cursor: 'pointer' }}
onClick={() => setPage('events')}>
<p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 6px', fontSize: 15 }}>{upcomingEvent.title}</p>
<p style={{ color: '#c9a96e', margin: '0 0 4px', fontSize: 13 }}>📅 {upcomingEvent.date}{upcomingEvent.time ? ' ' + upcomingEvent.time : ''}</p>
{upcomingEvent.location && <p style={{ color: '#aaa', margin: 0, fontSize: 13 }}>📍 {upcomingEvent.location}</p>}
<p style={{ color: '#888', margin: '8px 0 0', fontSize: 12 }}>タップしてイベント一覧へ →</p>
</div>
) : (
<p style={{ color: '#888', marginBottom: 24 }}>予定されているイベントはありません</p>
)}
<h3 style={{ color: '#c9a96e', margin: '0 0 12px' }}>🔔 最新アクティビティ</h3>
{activities.length === 0 ? (
<p style={{ color: '#888' }}>アクティビティはありません</p>
) : (
activities.map((a) => (
<div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #222' }}>
<span style={{ fontSize: 18 }}>{a.icon}</span>
<div>
<p style={{ color: '#ccc', margin: 0, fontSize: 14 }}>{a.text}</p>
<p style={{ color: '#555', margin: '2px 0 0', fontSize: 11 }}>{formatDate(a.createdAt)}</p>
</div>
</div>
))
)}
</div>
);
}


if (page === 'chat') return <Chat onUnreadChange={setChatUnread} userDoc={userDoc} />;
if (page === 'events') return <EventList userDoc={userDoc} isAdmin={isAdmin} onBack={() => setPage('dashboard')} />;
if (page === 'contact') return <Contact userDoc={userDoc} isAdmin={isAdmin} />;
if (page === 'dataadmin') return <DataAdmin />;
if (page === 'invite') return <InviteAdmin onBack={() => setPage('dashboard')} />;
if (page === 'members') {
  if (subPage === 'memberadmin') return <MemberAdmin onBack={() => setSubPage(null)} />;
  return (
    <div>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px 0' }}>
          <button style={{ background: 'none', border: '1px solid #555', color: '#aaa', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }} onClick={() => setSubPage('memberadmin')}>管理</button>
        </div>
      )}
      <ProfileList userDoc={userDoc} onBack={() => setPage('dashboard')} />
    </div>
  );
}
if (page === 'poll') {
  if (subPage === 'pollcreate') return <PollCreate userDoc={userDoc} onBack={() => setSubPage(null)} />;
  if (subPage === 'pollresult') return <PollResult userDoc={userDoc} onBack={() => setSubPage(null)} />;
  return (
    <div>
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px 0' }}>
          <button style={{ background: 'none', border: '1px solid #555', color: '#aaa', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }} onClick={() => setSubPage('pollresult')}>結果</button>
          <button style={{ background: '#c9a96e', border: 'none', color: '#1a1a2e', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }} onClick={() => setSubPage('pollcreate')}>作成</button>
        </div>
      )}
      <PollVote userDoc={userDoc} onBack={() => setPage('dashboard')} />
    </div>
  );
}


};

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
{['dashboard', 'chat', 'events', 'members', 'poll', 'contact', 'invite', 'dataadmin'].map((p) => (
(p !== 'invite' || isAdmin) && (p !== 'dataadmin' || isAdmin) && (
<button key={p} onClick={() => { setPage(p); setSubPage(null); if (p === 'chat') setChatUnread(0); }} style={{
padding: '12px 20px',
backgroundColor: page === p ? '#c9a96e' : 'transparent',
color: page === p ? '#1a1a2e' : '#888',
border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 13,
position: 'relative',
}}>
{p === 'dashboard' ? '🏠 ホーム'
: p === 'chat' ? '💬 チャット'
: p === 'events' ? '📅 イベント'
: p === 'members' ? '👥 メンバー'
: p === 'poll' ? '🗳️ 投票'
: p === 'contact' ? '📮 要望'
: p === 'dataadmin' ? '🗑️ 管理'
: '🔗 招待'}
{p === 'chat' && chatUnread > 0 && (
<span style={{ position: 'absolute', top: 4, right: 4, background: '#ff4444', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
{chatUnread}
</span>
)}
</button>
)
))}
</div>
{renderPage()}
</div>
);
}

export default App;