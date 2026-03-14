import { useState, useEffect, useRef } from "react";
import Navbar from '../Navbar';

const API = "http://localhost:5000/api";

const S = {
  page: { minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)", fontFamily:"'Georgia','Times New Roman',serif", color:"#e2e8f0", display:"flex", flexDirection:"column" },
  layout: { display:"flex", flex:1, maxWidth:"1200px", width:"100%", margin:"0 auto", height:"calc(100vh - 62px)", overflow:"hidden" },
  sidebar: { width:"280px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", overflowY:"auto", background:"rgba(15,23,42,0.4)" },
  sideTitle: { fontSize:"0.68rem", fontWeight:"700", letterSpacing:"0.13em", color:"#fbbf24", textTransform:"uppercase", padding:"1rem 1.2rem 0.5rem" },
  convItem: { display:"flex", alignItems:"center", gap:"0.7rem", padding:"0.8rem 1.2rem", cursor:"pointer", transition:"background 0.15s", borderLeft:"3px solid transparent" },
  convItemActive: { background:"rgba(37,99,235,0.1)", borderLeftColor:"#2563eb" },
  convAvatar: { width:"38px", height:"38px", borderRadius:"50%", background:"linear-gradient(135deg,#fbbf24,#f59e0b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", fontWeight:"700", color:"#0f172a", flexShrink:0 },
  convName: { fontWeight:"700", fontSize:"0.88rem", color:"#f1f5f9" },
  convPreview: { fontSize:"0.75rem", color:"#64748b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"150px" },
  convUnread: { marginLeft:"auto", flexShrink:0, background:"#2563eb", color:"#fff", fontSize:"0.62rem", fontWeight:"700", minWidth:"17px", height:"17px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" },
  chatPanel: { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  chatHeader: { padding:"0.9rem 1.5rem", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:"0.8rem", background:"rgba(15,23,42,0.5)", flexShrink:0 },
  chatName: { fontWeight:"700", fontSize:"1rem", color:"#f1f5f9" },
  chatSub:  { fontSize:"0.75rem", color:"#64748b" },
  messages: { flex:1, overflowY:"auto", padding:"1.2rem 1.5rem", display:"flex", flexDirection:"column", gap:"0.3rem" },
  bubbleWrap: (mine) => ({ display:"flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom:"2px" }),
  bubble: (mine) => ({
    maxWidth:"70%", padding:"0.65rem 1rem",
    borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background: mine ? "#2563eb" : "#334155",
    color:"#fff", fontSize:"0.9rem", lineHeight:"1.5",
    boxShadow:"0 2px 6px rgba(0,0,0,0.2)",
    opacity: 1, transition:"opacity 0.2s",
  }),
  bubbleTemp: { opacity: 0.6 },
  timeLabel: { fontSize:"0.62rem", color:"rgba(255,255,255,0.4)", marginTop:"3px", textAlign:"right" },
  dateDiv: { textAlign:"center", fontSize:"0.7rem", color:"#475569", margin:"0.8rem 0", userSelect:"none" },
  inputBar: { padding:"0.9rem 1.2rem", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:"0.7rem", alignItems:"flex-end", background:"rgba(15,23,42,0.5)", flexShrink:0 },
  msgInput: { flex:1, padding:"0.7rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,0.1)", background:"rgba(30,41,59,0.8)", color:"#e2e8f0", fontSize:"0.9rem", fontFamily:"inherit", outline:"none", resize:"none", minHeight:"42px", maxHeight:"110px", lineHeight:"1.5", boxSizing:"border-box" },
  sendBtn: { padding:"0.65rem 1.3rem", borderRadius:"10px", border:"none", background:"#2563eb", color:"#fff", fontWeight:"700", fontSize:"0.9rem", cursor:"pointer", fontFamily:"inherit", flexShrink:0, transition:"opacity 0.2s" },
  emptyChat: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"0.8rem", color:"#475569" },
  reqCard: { display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.65rem 1.2rem", background:"rgba(37,99,235,0.06)", borderBottom:"1px solid rgba(255,255,255,0.04)" },
  accBtn: { padding:"0.28rem 0.75rem", borderRadius:"6px", border:"none", background:"#2563eb", color:"#fff", fontSize:"0.73rem", fontWeight:"700", cursor:"pointer" },
  decBtn: { padding:"0.28rem 0.75rem", borderRadius:"6px", border:"1px solid rgba(248,113,113,0.4)", background:"transparent", color:"#f87171", fontSize:"0.73rem", fontWeight:"700", cursor:"pointer" },
};

// Helper — always extract the correct ID from whatever object we pass as activeUser
const getTargetId = (u) => u?.UserId || u?.OtherUserId || u?.ConnectedUserId;

export default function Inbox() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [connections,   setConnections]   = useState([]);
  const [pendingReqs,   setPendingReqs]   = useState([]);
  const [activeUser,    setActiveUser]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState("");
  const [sending,       setSending]       = useState(false);
  const [loadingChat,   setLoadingChat]   = useState(false);

  // ── Initial data load ───────────────────────────────────────
  const fetchSidebar = async () => {
    try {
      const [convs, conns, pending] = await Promise.all([
        fetch(`${API}/messages/inbox/${user.id}`).then(r => r.json()),
        fetch(`${API}/connections/my-connections/${user.id}`).then(r => r.json()),
        fetch(`${API}/connections/pending/${user.id}`).then(r => r.json()),
      ]);
      setConversations(Array.isArray(convs)    ? convs    : []);
      setConnections  (Array.isArray(conns)    ? conns    : []);
      setPendingReqs  (Array.isArray(pending)  ? pending  : []);
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (user.id) fetchSidebar();
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load + poll messages when active user changes ───────────
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!activeUser) return;

    loadMessages(false);
    pollRef.current = setInterval(() => loadMessages(true), 5000);
    return () => clearInterval(pollRef.current);
  }, [activeUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = async (silent = false) => {
    const targetId = getTargetId(activeUser);
    if (!targetId) return;
    if (!silent) setLoadingChat(true);
    try {
      const res  = await fetch(`${API}/messages/conversation/${user.id}/${targetId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      // Update unread count in sidebar
      setConversations(prev => prev.map(c =>
        c.OtherUserId === targetId ? { ...c, UnreadCount: 0 } : c
      ));
    } catch {}
    if (!silent) setLoadingChat(false);
  };

  // ── Auto-scroll ─────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = async () => {
    const targetId = getTargetId(activeUser);
    if (!text.trim() || !targetId || sending) return;

    const body = text.trim();
    setText("");
    setSending(true);

    // Optimistic update
    const temp = { MessageId:`tmp_${Date.now()}`, SenderId:user.id, Body:body, SentAt:new Date().toISOString(), isTemp:true };
    setMessages(prev => [...prev, temp]);

    try {
      const res = await fetch(`${API}/messages/send`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ senderId:user.id, receiverId:targetId, body }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to send message");
        setMessages(prev => prev.filter(m => m.MessageId !== temp.MessageId));
        setText(body); // restore text
      } else {
        loadMessages(true); // replace temp with real message
        fetchSidebar();     // refresh conversation preview
      }
    } catch {
      alert("Network error. Please try again.");
      setMessages(prev => prev.filter(m => m.MessageId !== temp.MessageId));
      setText(body);
    }
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Connection request response ──────────────────────────────
  const respondToConnection = async (connectionId, status, requesterId) => {
    try {
      await fetch(`${API}/connections/respond/${connectionId}`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ status, requesterId, receiverId:user.id }),
      });
      fetchSidebar();
    } catch {}
  };

  // ── Open chat from sidebar ───────────────────────────────────
  const openChat = (userObj) => {
    // Normalize to always have a UserId field
    const normalized = {
      UserId:     userObj.OtherUserId || userObj.ConnectedUserId || userObj.UserId,
      FullName:   userObj.FullName,
      ProfilePic: userObj.ProfilePic,
    };
    setActiveUser(normalized);
    setMessages([]);
  };

  const isActive = (id) => getTargetId(activeUser) === id;

  const initials = (n = "") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
  const fmtTime  = (d) => new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  const fmtDate  = (d) => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric" });

  const convUserIds = new Set(conversations.map(c => c.OtherUserId));

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .conv-item:hover  { background:rgba(255,255,255,0.04)!important; }
        .send-btn:hover   { opacity:0.85; }
        .msg-inp:focus    { border-color:rgba(37,99,235,0.5)!important; }
        ::-webkit-scrollbar       { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      <Navbar isSidebarOpen={false} setIsSidebarOpen={() => {}} />

      <div style={S.layout}>

        {/* ── Sidebar ── */}
        <div style={S.sidebar}>

          {/* Pending connection requests */}
          {pendingReqs.length > 0 && (
            <>
              <div style={{ ...S.sideTitle, color:"#f87171" }}>
                Requests ({pendingReqs.length})
              </div>
              {pendingReqs.map(req => (
                <div key={req.ConnectionId} style={S.reqCard}>
                  <div style={{ ...S.convAvatar, width:"30px", height:"30px", fontSize:"0.7rem" }}>
                    {initials(req.FullName)}
                  </div>
                  <span style={{ flex:1, fontSize:"0.8rem", color:"#e2e8f0", fontWeight:"600" }}>
                    {req.FullName}
                  </span>
                  <button style={S.accBtn} onClick={() => respondToConnection(req.ConnectionId, "Accepted", req.RequesterId)}>✓</button>
                  <button style={S.decBtn} onClick={() => respondToConnection(req.ConnectionId, "Rejected",  req.RequesterId)}>✕</button>
                </div>
              ))}
            </>
          )}

          {/* Recent conversations */}
          <div style={S.sideTitle}>Recent Chats</div>
          {conversations.length === 0 && (
            <div style={{ padding:"0.8rem 1.2rem", fontSize:"0.8rem", color:"#475569", fontStyle:"italic" }}>
              No messages yet
            </div>
          )}
          {conversations.map(c => (
            <div key={c.OtherUserId} className="conv-item"
              style={{ ...S.convItem, ...(isActive(c.OtherUserId) ? S.convItemActive : {}) }}
              onClick={() => openChat(c)}
            >
              <div style={S.convAvatar}>{initials(c.FullName)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={S.convName}>{c.FullName}</div>
                <div style={S.convPreview}>{c.LastMessage}</div>
              </div>
              {c.UnreadCount > 0 && <span style={S.convUnread}>{c.UnreadCount}</span>}
            </div>
          ))}

          {/* Connections with no messages yet */}
          {connections.filter(c => !convUserIds.has(c.ConnectedUserId)).length > 0 && (
            <>
              <div style={S.sideTitle}>Connections</div>
              {connections
                .filter(c => !convUserIds.has(c.ConnectedUserId))
                .map(conn => (
                  <div key={conn.ConnectedUserId} className="conv-item"
                    style={{ ...S.convItem, ...(isActive(conn.ConnectedUserId) ? S.convItemActive : {}) }}
                    onClick={() => openChat(conn)}
                  >
                    <div style={S.convAvatar}>{initials(conn.FullName)}</div>
                    <div>
                      <div style={S.convName}>{conn.FullName}</div>
                      <div style={{ ...S.convPreview, fontStyle:"italic" }}>Say hello 👋</div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* ── Chat Panel ── */}
        <div style={S.chatPanel}>
          {!activeUser ? (
            <div style={S.emptyChat}>
              <div style={{ fontSize:"3rem" }}>💬</div>
              <div style={{ fontWeight:"700", color:"#64748b", fontSize:"1.05rem" }}>
                {connections.length === 0 && conversations.length === 0
                  ? "No connections yet"
                  : "Select a conversation"}
              </div>
              <div style={{ fontSize:"0.85rem", color:"#475569", textAlign:"center", maxWidth:"280px", lineHeight:"1.6" }}>
                {connections.length === 0 && conversations.length === 0
                  ? "Get accepted into a project or connect with someone from the My Projects inbox to start messaging."
                  : "Pick a name from the left panel to open the chat."}
              </div>
              {connections.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.6rem", marginTop:"1rem", justifyContent:"center" }}>
                  {connections.slice(0,4).map(c => (
                    <button key={c.ConnectedUserId}
                      onClick={() => openChat(c)}
                      style={{
                        padding:"0.5rem 1.1rem", borderRadius:"20px",
                        border:"1px solid rgba(37,99,235,0.35)",
                        background:"rgba(37,99,235,0.08)", color:"#93c5fd",
                        fontSize:"0.82rem", fontWeight:"600", cursor:"pointer",
                        fontFamily:"inherit",
                      }}
                    >
                      💬 {c.FullName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={S.chatHeader}>
                <div style={S.convAvatar}>{initials(activeUser.FullName)}</div>
                <div>
                  <div style={S.chatName}>{activeUser.FullName}</div>
                  <div style={S.chatSub}>Connected via ProjectMate</div>
                </div>
              </div>

              {/* Messages */}
              <div style={S.messages}>
                {loadingChat ? (
                  <div style={{ textAlign:"center", color:"#475569", padding:"2rem" }}>Loading...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign:"center", color:"#475569", padding:"3rem", fontSize:"0.88rem", fontStyle:"italic" }}>
                    No messages yet. Break the ice! 👋
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const mine     = m.SenderId === user.id;
                    const prevDate = i > 0 ? fmtDate(messages[i-1].SentAt) : null;
                    const thisDate = fmtDate(m.SentAt);
                    return (
                      <div key={m.MessageId}>
                        {thisDate !== prevDate && (
                          <div style={S.dateDiv}>{thisDate}</div>
                        )}
                        <div style={S.bubbleWrap(mine)}>
                          <div style={{ maxWidth:"70%" }}>
                            <div style={{ ...S.bubble(mine), ...(m.isTemp ? S.bubbleTemp : {}) }}>
                              {m.Body}
                            </div>
                            <div style={S.timeLabel}>{fmtTime(m.SentAt)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={S.inputBar}>
                <textarea
                  className="msg-inp"
                  style={S.msgInput}
                  placeholder={`Message ${activeUser.FullName}...`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button
                  className="send-btn"
                  style={{ ...S.sendBtn, opacity: sending || !text.trim() ? 0.5 : 1 }}
                  onClick={sendMessage}
                  disabled={sending || !text.trim()}
                >
                  {sending ? "..." : "Send →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}