import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';

const API = "http://localhost:5000/api";

const Navbar = ({ isSidebarOpen = false, setIsSidebarOpen = () => {} }) => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const user      = JSON.parse(localStorage.getItem('user') || '{}');
    const bellRef   = useRef(null);

    const [showDropdown,   setShowDropdown]   = useState(false);
    const [showBell,       setShowBell]       = useState(false);
    const [profilePic,     setProfilePic]     = useState(null);
    const [notifications,  setNotifications]  = useState([]);
    const [unreadCount,    setUnreadCount]    = useState(0);
    const [msgUnread,      setMsgUnread]      = useState(0);

    // ── Fetch profile pic ──────────────────────────────────────
    useEffect(() => {
        if (!user?.id) return;
        axios.get(`${API}/user/details/${user.id}`)
            .then(res => {
                if (res.data.ProfilePic)
                    setProfilePic(`http://localhost:5000${res.data.ProfilePic}`);
            })
            .catch(() => {});
    }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Poll notifications + message unread count ──────────────
    useEffect(() => {
        if (!user?.id || user?.role !== 'Student') return;

        const fetchCounts = async () => {
            try {
                const [notifRes, msgRes] = await Promise.all([
                    axios.get(`${API}/notifications/unread-count/${user.id}`),
                    axios.get(`${API}/messages/unread-count/${user.id}`),
                ]);
                setUnreadCount(notifRes.data.count || 0);
                setMsgUnread(msgRes.data.count || 0);
            } catch {}
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 20000);
        return () => clearInterval(interval);
    }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Load notifications when bell opens ─────────────────────
    const openBell = async () => {
        if (!showBell) {
            try {
                const res = await axios.get(`${API}/notifications/${user.id}`);
                setNotifications(res.data);
                // Mark all as read
                if (unreadCount > 0) {
                    await axios.put(`${API}/notifications/mark-read/${user.id}`);
                    setUnreadCount(0);
                }
            } catch {}
        }
        setShowBell(prev => !prev);
        setShowDropdown(false);
    };

    // ── Close bell on outside click ────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target))
                setShowBell(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => { localStorage.clear(); navigate('/'); };
    const isActive = (path) => location.pathname === path;

    const initials = (name = "") =>
        name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1)  return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const notifIcon = (type) => {
        if (type === 'NewInterest')       return '⚡';
        if (type === 'Accepted')          return '✦';
        if (type === 'Rejected')          return '✕';
        if (type === 'Message')           return '💬';
        if (type === 'ConnectionRequest') return '🤝';
        if (type === 'ConnectionResponse')return '🔗';
        return '🔔';
    };

    // ============================================================
    // ADMIN PANEL
    // ============================================================
    if (user?.role === 'Admin') {
        return (
            <>
                <aside className={`admin-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <h2 style={{ padding: '20px', color: 'white' }}>PM Admin</h2>
                    </div>
                    <div className="sidebar-links">
                        <Link to="/admin-home"      className="sidebar-link">📊 Dashboard</Link>
                        <Link to="/manage-users"    className="sidebar-link">👥 Manage Users</Link>
                        <Link to="/manage-skills"   className="sidebar-link">🛠 Manage Skills</Link>
                        <Link to="/manage-projects" className="sidebar-link">📁 Manage Projects</Link>
                    </div>
                </aside>
                <header className={`admin-top-header ${!isSidebarOpen ? 'expanded' : ''}`}>
                    <button className="toggle-btn-new" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? '✖' : '☰'}
                    </button>
                    <div className="nav-right-section">
                        <div className="notification-bell">🔔<span className="bell-badge">3</span></div>
                        <div className="profile-dropdown-container">
                            <img src={profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=fbbf24&color=0f172a&size=40`} alt="Profile"
                                className="navbar-avatar" onClick={() => setShowDropdown(!showDropdown)} />
                            {showDropdown && (
                                <div className="dropdown-card">
                                    <div className="dropdown-user-info"><h4>{user?.name}</h4><p>{user?.role}</p></div>
                                    <Link to="/profile-settings" className="dropdown-action-item" onClick={() => setShowDropdown(false)}>⚙ Manage profile</Link>
                                    <button className="dropdown-action-item logout-text" onClick={handleLogout}>↪ Log out</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            </>
        );
    }

    // ============================================================
    // STUDENT NAVBAR
    // ============================================================
    const studentLinks = [
        { to: "/student-home",     label: "Home"            },
        { to: "/browse-projects",  label: "Browse Projects" },
        { to: "/create-project",   label: "Post Vision"     },
        { to: "/my-projects",      label: "My Projects"     },
        { to: "/my-applications",  label: "My Applications" },
        { to: "/student-profile",  label: "My Skills"       },
    ];

    return (
        <>
        <style>{`
            .student-navbar { position: sticky; top: 0; z-index: 200; }
            .nav-link-item  { position: relative; padding: 6px 10px; font-size:14px; color:#374151; text-decoration:none; white-space:nowrap; transition:color 0.18s; }
            .nav-link-item:hover { color: #2563eb; }
            .nav-link-item.active-link { color: #2563eb !important; font-weight: 700; }
            .nav-link-item.active-link::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:2px; background:#2563eb; border-radius:2px; }

            /* Bell button */
            .bell-wrap { position:relative; display:inline-flex; align-items:center; cursor:pointer; }
            .bell-icon-btn { background:none; border:none; font-size:1.2rem; cursor:pointer; padding:4px 8px; border-radius:8px; transition:background 0.18s; position:relative; }
            .bell-icon-btn:hover { background:rgba(37,99,235,0.08); }
            .bell-badge-new {
                position:absolute; top:-4px; right:-2px;
                background:#ef4444; color:#fff;
                font-size:0.6rem; font-weight:700;
                min-width:16px; height:16px; border-radius:8px;
                display:flex; align-items:center; justify-content:center;
                padding:0 3px; border:2px solid #fff;
                animation: pulse 1.8s infinite;
            }
            @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }

            /* Notification dropdown */
            .notif-dropdown {
                position:absolute; top:calc(100% + 10px); right:-120px;
                width:340px; max-height:420px; overflow-y:auto;
                background:#1e293b; border:1px solid rgba(255,255,255,0.1);
                border-radius:14px; box-shadow:0 16px 48px rgba(0,0,0,0.4);
                z-index:500; animation:dropIn 0.2s ease;
            }
            .notif-header {
                padding:1rem 1.2rem 0.6rem;
                border-bottom:1px solid rgba(255,255,255,0.06);
                display:flex; align-items:center; justify-content:space-between;
            }
            .notif-title { font-weight:700; color:#f1f5f9; font-size:0.95rem; font-family:Georgia,serif; }
            .notif-item {
                display:flex; gap:0.7rem; align-items:flex-start;
                padding:0.85rem 1.2rem;
                border-bottom:1px solid rgba(255,255,255,0.04);
                transition:background 0.15s; cursor:default;
            }
            .notif-item:hover { background:rgba(255,255,255,0.03); }
            .notif-item.unread { background:rgba(37,99,235,0.06); }
            .notif-icon { font-size:1.1rem; flex-shrink:0; margin-top:2px; }
            .notif-text { font-size:0.82rem; color:#cbd5e1; line-height:1.45; font-family:Georgia,serif; }
            .notif-time { font-size:0.72rem; color:#475569; margin-top:0.2rem; }
            .notif-empty { text-align:center; padding:2.5rem 1rem; color:#475569; font-size:0.88rem; font-family:Georgia,serif; }
            .msg-badge {
                display:inline-flex; align-items:center; justify-content:center;
                background:#ef4444; color:#fff; font-size:0.65rem; font-weight:700;
                min-width:16px; height:16px; border-radius:8px;
                padding:0 3px; margin-left:4px; vertical-align:middle;
            }
            @keyframes dropIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
            .dropdown-card { animation: dropIn 0.18s ease; }
        `}</style>

        <nav className="student-navbar">
            {/* Left: Brand + Links */}
            <div className="nav-links-left" style={{ gap:'2px', flexWrap:'nowrap', overflowX:'auto' }}>
                <h2 style={{ color:'#2563eb', cursor:'pointer', marginRight:'12px', whiteSpace:'nowrap', flexShrink:0 }}
                    onClick={() => navigate('/student-home')}>
                    Project-Mate
                </h2>
                {studentLinks.map(link => (
                    <Link key={link.to} to={link.to}
                        className={`nav-link-item ${isActive(link.to) ? 'active-link' : ''}`}>
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* Right: Bell + Messages + Profile */}
            <div className="nav-right-section" style={{ gap:'10px' }}>
                <span style={{ color:'#64748b', fontSize:'14px', whiteSpace:'nowrap' }}>
                    Welcome <b>{user?.name}</b> 👋
                </span>

                {/* 🔔 Notification Bell */}
                <div className="bell-wrap" ref={bellRef}>
                    <button className="bell-icon-btn" onClick={openBell}>
                        🔔
                        {unreadCount > 0 && (
                            <span className="bell-badge-new">{unreadCount}</span>
                        )}
                    </button>

                    {showBell && (
                        <div className="notif-dropdown">
                            <div className="notif-header">
                                <span className="notif-title">Notifications</span>
                                <span style={{ fontSize:'0.75rem', color:'#475569' }}>
                                    {notifications.length} total
                                </span>
                            </div>

                            {notifications.length === 0 ? (
                                <div className="notif-empty">
                                    <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🔔</div>
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.slice(0, 20).map(n => (
                                    <div key={n.NotificationId}
                                        className={`notif-item ${!n.IsRead ? 'unread' : ''}`}
                                        style={{ cursor: ['Accepted','Message','ConnectionResponse'].includes(n.Type) ? 'pointer' : 'default' }}
                                        onClick={() => {
                                            if (['Accepted','Message','ConnectionResponse'].includes(n.Type)) {
                                                setShowBell(false);
                                                navigate('/inbox');
                                            }
                                        }}
                                    >
                                        <span className="notif-icon">{notifIcon(n.Type)}</span>
                                        <div style={{ flex:1 }}>
                                            <div className="notif-text">{n.Message}</div>
                                            <div className="notif-time">{timeAgo(n.CreatedAt)}</div>
                                            {['Accepted','Message','ConnectionResponse'].includes(n.Type) && (
                                                <div style={{ fontSize:'0.7rem', color:'#2563eb', fontWeight:'700', marginTop:'3px' }}>
                                                    Tap to open inbox →
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* 💬 Messages link */}
                <Link to="/inbox" style={{ textDecoration:'none', fontSize:'1.15rem', position:'relative' }}>
                    💬
                    {msgUnread > 0 && (
                        <span className="msg-badge">{msgUnread}</span>
                    )}
                </Link>

                {/* Profile Dropdown */}
                <div className="profile-dropdown-container">
                    <img src={profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=fbbf24&color=0f172a&size=40`} alt="Profile"
                        className="navbar-avatar" onClick={() => { setShowDropdown(!showDropdown); setShowBell(false); }} />
                    {showDropdown && (
                        <div className="dropdown-card">
                            <div className="dropdown-user-info">
                                <h4>{user?.name}</h4><p>{user?.role}</p>
                            </div>
                            <Link to="/profile-settings" className="dropdown-action-item" onClick={() => setShowDropdown(false)}>⚙ Manage profile</Link>
                            <Link to="/student-profile"  className="dropdown-action-item" onClick={() => setShowDropdown(false)}>⚡ My Skills</Link>
                            <Link to="/inbox"            className="dropdown-action-item" onClick={() => setShowDropdown(false)}>
                                💬 Messages {msgUnread > 0 && <span className="msg-badge">{msgUnread}</span>}
                            </Link>
                            <button className="dropdown-action-item logout-text" onClick={handleLogout}>↪ Log out</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
        </>
    );
};

export default Navbar;