import { useState, useEffect } from "react";
import Navbar from '../Navbar';

const API = "http://localhost:5000/api";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#e2e8f0",
  },
  container: { maxWidth: "960px", margin: "0 auto", padding: "3rem 2rem" },
  pageTitle: { fontSize: "2.5rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.4rem", letterSpacing: "-0.02em" },
  pageSubtitle: { color: "#94a3b8", fontSize: "1rem", marginBottom: "2.5rem", fontStyle: "italic" },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
  },
  inboxBtn: {
    position: "relative",
    padding: "0.55rem 1.3rem",
    borderRadius: "8px",
    border: "1px solid rgba(251,191,36,0.35)",
    background: "transparent",
    color: "#fbbf24",
    fontSize: "0.88rem",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  inboxBadge: {
    position: "absolute",
    top: "-7px", right: "-7px",
    background: "#ef4444", color: "#fff",
    fontSize: "0.65rem", fontWeight: "700",
    minWidth: "18px", height: "18px",
    borderRadius: "9px",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 4px",
    border: "2px solid #0f172a",
    animation: "pulse 1.8s infinite",
  },
  sectionLabel: {
    fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em",
    color: "#fbbf24", textTransform: "uppercase", marginBottom: "1rem",
  },
  projCard: {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "1.6rem",
    marginBottom: "1rem",
    transition: "all 0.2s",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projTitle: { fontWeight: "700", fontSize: "1.05rem", color: "#f1f5f9", marginBottom: "0.3rem" },
  projMeta: { color: "#64748b", fontSize: "0.82rem" },
  badge: {
    fontSize: "0.75rem", fontWeight: "700",
    padding: "0.3rem 0.9rem", borderRadius: "20px", letterSpacing: "0.06em",
  },
  approvedBadge: { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" },
  pendingBadge:  { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(6px)",
    zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1rem",
  },
  modal: {
    background: "#1e293b",
    border: "1px solid rgba(251,191,36,0.2)",
    borderRadius: "20px",
    padding: "2.2rem",
    maxWidth: "680px", width: "100%",
    maxHeight: "85vh", overflowY: "auto",
    position: "relative",
  },
  modalTitle: { fontSize: "1.5rem", fontWeight: "700", color: "#f1f5f9", marginBottom: "0.3rem" },
  modalSub: { color: "#64748b", fontSize: "0.88rem", marginBottom: "1.5rem" },
  requestCard: {
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "12px",
    padding: "1.2rem", marginBottom: "0.8rem",
  },
  requestHeader: { display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.6rem" },
  avatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.75rem", fontWeight: "700", color: "#0f172a", flexShrink: 0,
  },
  applicantName: { fontWeight: "700", color: "#e2e8f0", fontSize: "0.95rem" },
  roleLine: { color: "#94a3b8", fontSize: "0.82rem" },
  msgBox: {
    background: "rgba(30,41,59,0.5)", borderRadius: "8px",
    padding: "0.6rem 0.9rem", fontSize: "0.85rem",
    color: "#94a3b8", fontStyle: "italic",
    marginBottom: "0.8rem", lineHeight: "1.5",
  },
  actionRow: { display: "flex", gap: "0.6rem" },
  acceptBtn: {
    flex: 1, padding: "0.55rem", borderRadius: "8px", border: "none",
    background: "linear-gradient(135deg, #34d399, #10b981)",
    color: "#0f172a", fontWeight: "700", fontSize: "0.88rem",
    cursor: "pointer", fontFamily: "inherit",
  },
  rejectBtn: {
    flex: 1, padding: "0.55rem", borderRadius: "8px",
    border: "1.5px solid rgba(248,113,113,0.35)",
    background: "transparent", color: "#f87171",
    fontWeight: "700", fontSize: "0.88rem",
    cursor: "pointer", fontFamily: "inherit",
  },
  closeBtn: {
    position: "absolute", top: "1.2rem", right: "1.4rem",
    background: "none", border: "none", color: "#64748b",
    fontSize: "1.4rem", cursor: "pointer", lineHeight: 1,
  },
  emptyState: { textAlign: "center", padding: "4rem 2rem", color: "#475569" },
  toast: {
    position: "fixed", bottom: "2rem", right: "2rem",
    padding: "1rem 1.5rem", borderRadius: "12px",
    fontWeight: "600", fontSize: "0.95rem", zIndex: 999,
    animation: "fadeIn 0.3s ease",
  },
};

export default function MyProjects() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showInbox, setShowInbox] = useState(false);
  const [toast, setToast]       = useState(null);
  const [responding, setResponding] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const initials = (name = "") =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!user.id) return;
    Promise.all([
      fetch(`${API}/projects/my-projects/${user.id}`).then(r => r.json()),
      fetch(`${API}/interests/incoming/${user.id}`).then(r => r.json()),
    ]).then(([projs, reqs]) => {
      setProjects(projs);
      setRequests(reqs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRespond = async (interest, status) => {
    setResponding(interest.InterestId);
    try {
      const res = await fetch(`${API}/interests/respond/${interest.InterestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          applicantId: interest.ApplicantId,
          projectId:   interest.ProjectId,
          roleId:      interest.RoleId,
          roleName:    interest.RoleName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.InterestId !== interest.InterestId));
        showToast(`Application ${status.toLowerCase()} successfully`);
        if (status === "Accepted") {
          const updated = await fetch(`${API}/projects/my-projects/${user.id}`).then(r => r.json());
          setProjects(updated);
        }
      } else {
        showToast(data.error || "Something went wrong", false);
      }
    } catch {
      showToast("Network error", false);
    }
    setResponding(null);
  };

  const handleConnect = async (receiverId) => {
    try {
      const res = await fetch(`${API}/connections/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user.id, receiverId }),
      });
      const data = await res.json();
      showToast(data.message || "Connect request sent!");
    } catch {
      showToast("Failed to send connect request", false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .proj-card:hover  { border-color:rgba(251,191,36,0.28)!important; transform:translateX(4px); }
        .accept-btn:hover { opacity:0.85; }
        .reject-btn:hover { background:rgba(248,113,113,0.08)!important; }
        .inbox-btn:hover  { background:rgba(251,191,36,0.08)!important; }
      `}</style>

      <Navbar isSidebarOpen={false} setIsSidebarOpen={() => {}} />

      <div style={styles.container}>

        {/* Title row + Inbox button */}
        <div style={styles.topRow}>
          <div>
            <h1 style={{ ...styles.pageTitle, marginBottom: "0.2rem" }}>My Projects</h1>
            <p style={styles.pageSubtitle}>Projects you've created as a project lead.</p>
          </div>

          <button
            className="inbox-btn"
            style={{
              ...styles.inboxBtn,
              ...(requests.length > 0 ? { borderColor: "rgba(251,191,36,0.7)" } : {}),
            }}
            onClick={() => setShowInbox(true)}
          >
            🔔 Inbox
            {requests.length > 0 && (
              <span style={styles.inboxBadge}>{requests.length}</span>
            )}
          </button>
        </div>

        {/* Projects list */}
        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : projects.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◎</div>
            <div>You haven't created any projects yet.</div>
          </div>
        ) : (
          <>
            <div style={styles.sectionLabel}>Your Projects ({projects.length})</div>
            {projects.map(p => (
              <div key={p.ProjectId} className="proj-card" style={styles.projCard}>
                <div>
                  <div style={styles.projTitle}>{p.Title}</div>
                  <div style={styles.projMeta}>
                    {p.MemberCount} member{p.MemberCount !== 1 ? "s" : ""}
                    &nbsp;·&nbsp;{p.Status}
                    &nbsp;·&nbsp;Created {new Date(p.CreatedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                  </div>
                </div>
                <span style={{ ...styles.badge, ...(p.IsApproved ? styles.approvedBadge : styles.pendingBadge) }}>
                  {p.IsApproved ? "Live" : "Pending Approval"}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Inbox Modal */}
      {showInbox && (
        <div style={styles.overlay} onClick={() => setShowInbox(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setShowInbox(false)}>✕</button>
            <div style={styles.modalTitle}>Incoming Requests</div>
            <div style={styles.modalSub}>
              {requests.length} pending application{requests.length !== 1 ? "s" : ""} for your projects
            </div>

            {requests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#475569" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>✓</div>
                All caught up! No pending requests.
              </div>
            ) : (
              requests.map(req => (
                <div key={req.InterestId} style={styles.requestCard}>
                  <div style={styles.requestHeader}>
                    <div style={styles.avatar}>{initials(req.ApplicantName)}</div>
                    <div>
                      <div style={styles.applicantName}>{req.ApplicantName}</div>
                      <div style={styles.roleLine}>
                        Applied for{" "}
                        <strong style={{ color: "#fbbf24" }}>{req.RoleName}</strong>
                        {" "}in <em>{req.ProjectTitle}</em>
                      </div>
                    </div>
                  </div>
                  {req.Message && (
                    <div style={styles.msgBox}>"{req.Message}"</div>
                  )}
                  <div style={styles.actionRow}>
                    <button
                      className="accept-btn"
                      style={styles.acceptBtn}
                      disabled={responding === req.InterestId}
                      onClick={() => handleRespond(req, "Accepted")}
                    >
                      {responding === req.InterestId ? "..." : "✓ Accept"}
                    </button>
                    <button
                      className="reject-btn"
                      style={styles.rejectBtn}
                      disabled={responding === req.InterestId}
                      onClick={() => handleRespond(req, "Rejected")}
                    >
                      ✕ Decline
                    </button>
                    <button
                      style={{
                        padding:"0.55rem 0.9rem", borderRadius:"8px",
                        border:"1px solid rgba(251,191,36,0.35)",
                        background:"transparent", color:"#fbbf24",
                        fontSize:"0.82rem", fontWeight:"700",
                        cursor:"pointer", fontFamily:"inherit", flexShrink:0,
                      }}
                      onClick={() => handleConnect(req.ApplicantId)}
                    >
                      🤝 Connect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          color:      toast.ok ? "#34d399"               : "#f87171",
          border:     `1px solid ${toast.ok ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}