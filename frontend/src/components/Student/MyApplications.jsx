import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../Navbar';

const API = "http://localhost:5000/api";

const statusStyle = {
  Pending:  { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  Accepted: { bg: "rgba(52,211,153,0.1)",  color: "#34d399", border: "rgba(52,211,153,0.3)" },
  Rejected: { bg: "rgba(248,113,113,0.1)", color: "#f87171", border: "rgba(248,113,113,0.3)" },
};
const statusIcon = { Pending: "◌", Accepted: "✦", Rejected: "✕" };

const styles = {
  page: { minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)", fontFamily:"'Georgia','Times New Roman',serif", color:"#e2e8f0" },
  container: { maxWidth:"860px", margin:"0 auto", padding:"3rem 2rem" },
  pageTitle: { fontSize:"2.5rem", fontWeight:"700", color:"#f8fafc", marginBottom:"0.4rem", letterSpacing:"-0.02em" },
  pageSubtitle: { color:"#94a3b8", fontSize:"1rem", marginBottom:"2.5rem", fontStyle:"italic" },
  tabs: { display:"flex", gap:"0.5rem", marginBottom:"2rem", flexWrap:"wrap" },
  tab: { padding:"0.5rem 1.3rem", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"#64748b", fontSize:"0.88rem", fontWeight:"600", cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit" },
  tabActive: { background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.35)", color:"#fbbf24" },
  card: { background:"rgba(30,41,59,0.7)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"14px", padding:"1.6rem", marginBottom:"1rem", display:"flex", alignItems:"flex-start", gap:"1.2rem", backdropFilter:"blur(6px)" },
  statusDot: { width:"42px", height:"42px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 },
  cardBody: { flex:1 },
  projectTitle: { fontWeight:"700", fontSize:"1.08rem", color:"#f1f5f9", marginBottom:"0.25rem" },
  roleText: { color:"#94a3b8", fontSize:"0.88rem", marginBottom:"0.4rem" },
  leaderText: { color:"#64748b", fontSize:"0.82rem", marginBottom:"0.6rem" },
  message: { background:"rgba(15,23,42,0.5)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"8px", padding:"0.6rem 0.9rem", fontSize:"0.85rem", color:"#94a3b8", fontStyle:"italic", lineHeight:"1.5" },
  statusBadge: { fontSize:"0.78rem", fontWeight:"700", padding:"0.3rem 0.85rem", borderRadius:"20px", letterSpacing:"0.06em", textTransform:"uppercase", border:"1px solid", whiteSpace:"nowrap" },
  dateText: { fontSize:"0.75rem", color:"#475569", marginTop:"0.5rem" },
  emptyState: { textAlign:"center", padding:"5rem 2rem", color:"#475569" },
  statRow: { display:"flex", gap:"1rem", marginBottom:"2rem" },
  statBox: { flex:1, background:"rgba(30,41,59,0.5)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"12px", padding:"1.2rem", textAlign:"center" },
  statNum: { fontSize:"2rem", fontWeight:"700", marginBottom:"0.2rem" },
  statLabel: { fontSize:"0.78rem", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em" },
};

// Safely extract the interest status from a row
// Handles: InterestStatus, Status, status — whatever the DB returns
const getStatus = (app) => {
  const raw = app.InterestStatus ?? app.Status ?? app.status ?? "";
  if (!raw) return "Pending";
  const s = raw.trim().toLowerCase();
  if (s === "accepted") return "Accepted";
  if (s === "rejected") return "Rejected";
  return "Pending";
};

export default function MyApplications() {
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("All");
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (!user.id) return;
    fetch(`${API}/interests/my-applications/${user.id}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        // Debug: show what fields we're actually getting
        if (list.length > 0) {
          const sample = list[0];
          setDebugInfo({
            fields: Object.keys(sample),
            statusField: sample.InterestStatus ?? sample.Status ?? sample.status ?? "NOT FOUND",
          });
          console.log("Raw API fields:", Object.keys(sample));
          console.log("Sample row:", sample);
        }
        setApps(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Normalize all apps so Status is always clean
  const normalizedApps = apps.map(a => ({ ...a, Status: getStatus(a) }));

  const counts = {
    All:      normalizedApps.length,
    Pending:  normalizedApps.filter(a => a.Status === "Pending").length,
    Accepted: normalizedApps.filter(a => a.Status === "Accepted").length,
    Rejected: normalizedApps.filter(a => a.Status === "Rejected").length,
  };

  const visible = filter === "All"
    ? normalizedApps
    : normalizedApps.filter(a => a.Status === filter);

  const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

  return (
    <div style={styles.page}>
      <style>{`.app-card:hover { border-color:rgba(251,191,36,0.2)!important; }`}</style>
      <Navbar isSidebarOpen={false} setIsSidebarOpen={() => {}} />

      <div style={styles.container}>
        <h1 style={styles.pageTitle}>My Applications</h1>
        <p style={styles.pageSubtitle}>Track the status of all your project interest submissions.</p>

        {/* Debug banner — remove after fixing */}
        {debugInfo && (
          <div style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:"8px", padding:"0.7rem 1rem", marginBottom:"1rem", fontSize:"0.75rem", color:"#fbbf24" }}>
            🔍 Debug: Status field value = <strong>"{debugInfo.statusField}"</strong>
            &nbsp;· Fields: {debugInfo.fields.join(", ")}
          </div>
        )}

        {/* Stats */}
        <div style={styles.statRow}>
          {["Pending","Accepted","Rejected"].map(s => {
            const st = statusStyle[s];
            return (
              <div key={s} style={{ ...styles.statBox, borderColor:st.border }}>
                <div style={{ ...styles.statNum, color:st.color }}>{counts[s]}</div>
                <div style={styles.statLabel}>{s}</div>
              </div>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <div style={styles.tabs}>
          {["All","Pending","Accepted","Rejected"].map(f => (
            <button key={f}
              style={{ ...styles.tab, ...(filter === f ? styles.tabActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f} ({counts[f] ?? apps.length})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : visible.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>◎</div>
            <div>No {filter === "All" ? "" : filter.toLowerCase() + " "}applications yet.</div>
          </div>
        ) : (
          visible.map(app => {
            const st = statusStyle[app.Status] || statusStyle.Pending;
            return (
              <div key={app.InterestId} className="app-card" style={styles.card}>
                <div style={{ ...styles.statusDot, background:st.bg, color:st.color }}>
                  {statusIcon[app.Status] || "◌"}
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.projectTitle}>{app.ProjectTitle}</div>
                  <div style={styles.roleText}>Role: <strong>{app.RoleName}</strong></div>
                  <div style={styles.leaderText}>Project Lead: {app.LeaderName}</div>
                  {!app.ProjectIsApproved && (
                    <div style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", fontSize:"0.75rem", fontWeight:"600", color:"#f59e0b", marginBottom:"0.5rem", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:"6px", padding:"0.25rem 0.7rem" }}>
                      ⏳ Waiting for admin to approve this project
                    </div>
                  )}
                  {app.AppMessage && (
                    <div style={styles.message}>"{app.AppMessage}"</div>
                  )}
                  <div style={styles.dateText}>Applied on {fmt(app.AppDate || app.CreatedAt)}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.5rem" }}>
                  <span style={{ ...styles.statusBadge, background:st.bg, color:st.color, borderColor:st.border }}>
                    {app.Status}
                  </span>
                  {app.Status === "Accepted" && (
                    <button onClick={() => navigate("/inbox")} style={{ padding:"0.35rem 0.9rem", borderRadius:"8px", border:"none", background:"linear-gradient(135deg,#2563eb,#1d4ed8)", color:"#fff", fontSize:"0.75rem", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                      💬 Message Lead
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}