import { useState, useEffect } from "react";
import Navbar from '../Navbar';

const API = "http://localhost:5000/api";

const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#e2e8f0",
  },
  header: {
    background: "rgba(15,23,42,0.97)",
    borderBottom: "1px solid rgba(251,191,36,0.18)",
    padding: "1.1rem 2.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(14px)",
  },
  logo: { fontSize: "1.4rem", fontWeight: "700", color: "#fbbf24", letterSpacing: "0.05em" },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "2.8rem 2rem" },
  pageTitle: { fontSize: "2.6rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.3rem", letterSpacing: "-0.02em" },
  pageSub: { color: "#94a3b8", fontSize: "1rem", marginBottom: "2rem", fontStyle: "italic" },
  searchBar: {
    width: "100%",
    padding: "0.85rem 1.3rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(251,191,36,0.2)",
    background: "rgba(30,41,59,0.8)",
    color: "#e2e8f0",
    fontSize: "0.97rem",
    marginBottom: "2rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "1.6rem",
  },
  card: {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(251,191,36,0.1)",
    borderRadius: "16px",
    padding: "1.7rem",
    cursor: "pointer",
    transition: "all 0.25s ease",
    backdropFilter: "blur(8px)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: "0.8rem",
  },
  cardAccent: {
    position: "absolute", top: 0, left: 0,
    width: "4px", height: "100%",
    background: "linear-gradient(180deg, #fbbf24, #f59e0b)",
    borderRadius: "16px 0 0 16px",
  },
  cardTitle: { fontSize: "1.15rem", fontWeight: "700", color: "#f1f5f9", paddingLeft: "0.5rem" },
  cardDesc: {
    fontSize: "0.88rem", color: "#94a3b8", lineHeight: "1.6", paddingLeft: "0.5rem",
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  leaderRow: { display: "flex", alignItems: "center", gap: "0.55rem", paddingLeft: "0.5rem" },
  avatar: {
    width: "26px", height: "26px", borderRadius: "50%",
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.65rem", fontWeight: "700", color: "#0f172a", flexShrink: 0,
  },
  leaderName: { fontSize: "0.82rem", color: "#cbd5e1" },
  rolesWrap: { display: "flex", flexWrap: "wrap", gap: "0.4rem", paddingLeft: "0.5rem" },
  roleTag: { fontSize: "0.73rem", padding: "0.22rem 0.65rem", borderRadius: "20px", fontWeight: "600" },
  roleOpen: { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.28)" },
  roleFilled: { background: "rgba(100,116,139,0.15)", color: "#64748b", border: "1px solid rgba(100,116,139,0.2)", textDecoration: "line-through" },
  interestedBtn: {
    marginTop: "0.4rem",
    marginLeft: "0.5rem",
    padding: "0.6rem 1.2rem",
    borderRadius: "9px",
    border: "none",
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    color: "#0f172a",
    fontWeight: "700",
    fontSize: "0.88rem",
    cursor: "pointer",
    alignSelf: "flex-start",
    letterSpacing: "0.03em",
    transition: "opacity 0.2s, transform 0.15s",
    fontFamily: "inherit",
  },
  alreadyBtn: {
    marginTop: "0.4rem",
    marginLeft: "0.5rem",
    padding: "0.6rem 1.2rem",
    borderRadius: "9px",
    border: "1.5px solid rgba(52,211,153,0.4)",
    background: "transparent",
    color: "#34d399",
    fontWeight: "700",
    fontSize: "0.88rem",
    cursor: "default",
    alignSelf: "flex-start",
    letterSpacing: "0.03em",
    fontFamily: "inherit",
  },
  // Modal
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(7px)",
    zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1rem",
  },
  modal: {
    background: "#1a2540",
    border: "1px solid rgba(251,191,36,0.18)",
    borderRadius: "20px",
    padding: "2.4rem",
    maxWidth: "560px",
    width: "100%",
    maxHeight: "88vh",
    overflowY: "auto",
    position: "relative",
    animation: "slideUp 0.28s ease",
  },
  modalTitle: { fontSize: "1.6rem", fontWeight: "700", color: "#f1f5f9", marginBottom: "0.4rem" },
  modalDesc: { color: "#94a3b8", lineHeight: "1.7", marginBottom: "1.4rem", fontSize: "0.93rem" },
  sectionLabel: {
    fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.12em",
    color: "#fbbf24", textTransform: "uppercase", marginBottom: "0.8rem",
  },
  roleSelectRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.85rem 1rem", borderRadius: "10px",
    background: "rgba(15,23,42,0.55)",
    border: "1px solid rgba(255,255,255,0.05)",
    marginBottom: "0.5rem",
    cursor: "pointer",
    transition: "border-color 0.18s, background 0.18s",
  },
  roleSelectRowActive: {
    borderColor: "rgba(251,191,36,0.5)",
    background: "rgba(251,191,36,0.06)",
  },
  roleSelectName: { fontWeight: "600", color: "#e2e8f0", fontSize: "0.93rem" },
  roleSelectSkill: { fontSize: "0.75rem", color: "#64748b", marginTop: "0.18rem", fontStyle: "italic" },
  radioCircle: {
    width: "18px", height: "18px", borderRadius: "50%",
    border: "2px solid #475569",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "border-color 0.18s",
  },
  radioCircleActive: { borderColor: "#fbbf24" },
  radioDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#fbbf24" },
  textarea: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(251,191,36,0.18)",
    background: "rgba(15,23,42,0.7)",
    color: "#e2e8f0",
    fontSize: "0.93rem",
    resize: "vertical",
    minHeight: "85px",
    fontFamily: "inherit",
    marginTop: "0.5rem",
    boxSizing: "border-box",
    outline: "none",
  },
  submitBtn: {
    marginTop: "1.2rem",
    padding: "0.8rem 2rem",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    color: "#0f172a",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
    width: "100%",
    letterSpacing: "0.03em",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
  closeBtn: {
    position: "absolute", top: "1.1rem", right: "1.3rem",
    background: "none", border: "none", color: "#64748b",
    fontSize: "1.3rem", cursor: "pointer", lineHeight: 1,
  },
  membersSection: { marginTop: "1.4rem" },
  memberRow: { display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.45rem" },
  memberName: { color: "#cbd5e1", fontSize: "0.88rem" },
  memberRole: { color: "#64748b", fontSize: "0.78rem" },
  toast: {
    position: "fixed", bottom: "2rem", right: "2rem",
    padding: "0.9rem 1.4rem", borderRadius: "12px",
    fontWeight: "600", fontSize: "0.93rem", zIndex: 999,
    animation: "fadeIn 0.3s ease",
  },
  emptyState: { textAlign: "center", padding: "5rem 2rem", color: "#475569" },
};

export default function BrowseProjects() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [projects, setProjects]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);  // project detail modal
  const [selectedRole, setSelectedRole] = useState(null);
  const [message, setMessage]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState(null);
  // track which projects this user already applied to (projectId set)
  const [appliedProjects, setAppliedProjects] = useState(new Set());

  // Load projects
  useEffect(() => {
    fetch(`${API}/projects/browse`)
      .then(r => r.json())
      .then(data => { setProjects(data); setFiltered(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load already-applied projects for this user
  useEffect(() => {
    if (!user.id) return;
    fetch(`${API}/interests/my-applications/${user.id}`)
      .then(r => r.json())
      .then(data => {
        const ids = new Set(data.map(a => a.ProjectId));
        setAppliedProjects(ids);
      })
      .catch(() => {});
  }, [user.id]);

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      projects.filter(p =>
        p.Title.toLowerCase().includes(q) ||
        p.Description.toLowerCase().includes(q) ||
        p.LeaderName.toLowerCase().includes(q) ||
        p.roles?.some(r => r.RoleName.toLowerCase().includes(q))
      )
    );
  }, [search, projects]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const openProject = async (proj) => {
    // Don't open own project with apply option - still allow viewing
    try {
      const res = await fetch(`${API}/projects/${proj.ProjectId}`);
      const data = await res.json();
      setSelected(data);
      setSelectedRole(null);
      setMessage("");
    } catch {
      showToast("Failed to load project details", false);
    }
  };

  const handleSubmitInterest = async () => {
    if (!selectedRole) {
      showToast("Please select a role to apply for.", false);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/interests/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selected.ProjectId,
          roleId: selectedRole.RoleId,
          applicantId: user.id,
          message,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("🎉 Interest sent! The project lead has been notified.");
        // Mark as applied
        setAppliedProjects(prev => new Set([...prev, selected.ProjectId]));
        setSelected(null);
      } else {
        showToast(data.message || "Something went wrong.", false);
      }
    } catch {
      showToast("Network error", false);
    }
    setSubmitting(false);
  };

  const initials = (name = "") =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const isOwnProject = (proj) => proj.LeaderId === user.id || proj.LeaderName === user.name;
  const openRoles = (proj) => proj.roles?.filter(r => !r.IsFilled) || [];

  return (
    <div style={S.page}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
        .proj-card:hover   { transform:translateY(-4px); border-color:rgba(251,191,36,0.3)!important; box-shadow:0 14px 38px rgba(0,0,0,0.35); }
        .interested-btn:hover { opacity:0.84; transform:scale(1.03); }
        .search-inp:focus  { border-color:rgba(251,191,36,0.55)!important; }
        .role-row:hover    { border-color:rgba(251,191,36,0.4)!important; background:rgba(251,191,36,0.05)!important; }
        .submit-btn:hover  { opacity:0.86; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(251,191,36,0.25); border-radius:5px; }
      `}</style>

      <Navbar />

      <div style={S.container}>
        <h1 style={S.pageTitle}>Browse Projects</h1>
        <p style={S.pageSub}>Discover open projects and express your interest to join.</p>

        <input
          className="search-inp"
          style={S.searchBar}
          placeholder="Search by title, role, skill or leader name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <div style={S.emptyState}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                display:"inline-block", width:"8px", height:"8px", borderRadius:"50%",
                background:"#fbbf24", margin:"0 3px",
                animation:`bounce 1s ${i*0.15}s infinite`,
              }} />
            ))}
            <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>◎</div>
            <div>No open projects found.</div>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map(proj => {
              const open = openRoles(proj);
              const applied = appliedProjects.has(proj.ProjectId);
              const own = proj.LeaderId === user.id;

              return (
                <div
                  key={proj.ProjectId}
                  className="proj-card"
                  style={S.card}
                >
                  <div style={S.cardAccent} />

                  {/* Clickable area */}
                  <div onClick={() => openProject(proj)} style={{ cursor:"pointer" }}>
                    <div style={S.cardTitle}>{proj.Title}</div>
                    <div style={S.cardDesc}>{proj.Description}</div>
                    <div style={S.leaderRow}>
                      <div style={S.avatar}>{initials(proj.LeaderName)}</div>
                      <span style={S.leaderName}>{proj.LeaderName}</span>
                    </div>
                    <div style={S.rolesWrap}>
                      {proj.roles?.map(r => (
                        <span key={r.RoleId} style={{ ...S.roleTag, ...(r.IsFilled ? S.roleFilled : S.roleOpen) }}>
                          {r.RoleName}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Interested button — not shown for own projects */}
                  {!own && (
                    applied ? (
                      <button style={S.alreadyBtn} disabled>✓ Interest Sent</button>
                    ) : open.length > 0 ? (
                      <button
                        className="interested-btn"
                        style={S.interestedBtn}
                        onClick={(e) => { e.stopPropagation(); openProject(proj); }}
                      >
                        I'm Interested →
                      </button>
                    ) : (
                      <button style={{ ...S.alreadyBtn, borderColor:"rgba(100,116,139,0.3)", color:"#475569" }} disabled>
                        All Roles Filled
                      </button>
                    )
                  )}
                  {own && (
                    <span style={{ ...S.alreadyBtn, border:"none", color:"#475569", fontSize:"0.78rem", padding:"0.3rem 0.5rem", cursor:"default" }}>
                      Your Project
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Detail + Apply Modal */}
      {selected && (
        <div style={S.overlay} onClick={() => setSelected(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <button style={S.closeBtn} onClick={() => setSelected(null)}>✕</button>

            <div style={S.modalTitle}>{selected.Title}</div>
            <div style={S.leaderRow}>
              <div style={S.avatar}>{initials(selected.LeaderName)}</div>
              <span style={{ color:"#94a3b8", fontSize:"0.88rem" }}>
                by <strong style={{ color:"#fbbf24" }}>{selected.LeaderName}</strong>
              </span>
            </div>
            <div style={{ ...S.modalDesc, marginTop:"0.8rem" }}>{selected.Description}</div>

            {/* Show apply section only if not own project and not already applied */}
            {selected.LeaderId !== user.id && !appliedProjects.has(selected.ProjectId) ? (
              <>
                <div style={S.sectionLabel}>Select a Role to Apply For</div>
                {selected.roles?.filter(r => !r.IsFilled).map(role => (
                  <div
                    key={role.RoleId}
                    className="role-row"
                    style={{
                      ...S.roleSelectRow,
                      ...(selectedRole?.RoleId === role.RoleId ? S.roleSelectRowActive : {}),
                    }}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div>
                      <div style={S.roleSelectName}>{role.RoleName}</div>
                      {role.SkillName && (
                        <div style={S.roleSelectSkill}>Requires: {role.SkillName}</div>
                      )}
                    </div>
                    <div style={{
                      ...S.radioCircle,
                      ...(selectedRole?.RoleId === role.RoleId ? S.radioCircleActive : {}),
                    }}>
                      {selectedRole?.RoleId === role.RoleId && <div style={S.radioDot} />}
                    </div>
                  </div>
                ))}

                {selected.roles?.every(r => r.IsFilled) && (
                  <div style={{ color:"#475569", fontSize:"0.88rem", textAlign:"center", padding:"1rem" }}>
                    All roles are currently filled.
                  </div>
                )}

                {selectedRole && (
                  <div style={{ marginTop:"1.2rem", animation:"fadeIn 0.2s ease" }}>
                    <div style={S.sectionLabel}>Message to Project Lead (optional)</div>
                    <textarea
                      style={S.textarea}
                      placeholder={`Tell ${selected.LeaderName} why you're a great fit for "${selectedRole?.RoleName}"...`}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                    <button
                      className="submit-btn"
                      style={S.submitBtn}
                      onClick={handleSubmitInterest}
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Send Interest — Notify Project Lead →"}
                    </button>
                  </div>
                )}
              </>
            ) : selected.LeaderId === user.id ? (
              <div style={{ color:"#475569", fontSize:"0.88rem", fontStyle:"italic", marginTop:"0.5rem" }}>
                This is your project.
              </div>
            ) : (
              <div style={{
                padding:"0.8rem 1rem", borderRadius:"10px",
                background:"rgba(52,211,153,0.08)", color:"#34d399",
                border:"1px solid rgba(52,211,153,0.25)", fontSize:"0.9rem",
                marginTop:"0.5rem",
              }}>
                ✓ You have already expressed interest in this project.
              </div>
            )}

            {/* Current team */}
            {selected.members?.length > 0 && (
              <div style={S.membersSection}>
                <div style={{ ...S.sectionLabel, marginTop:"1.5rem" }}>Current Team</div>
                {selected.members.map((m, i) => (
                  <div key={i} style={S.memberRow}>
                    <div style={S.avatar}>{initials(m.FullName)}</div>
                    <span style={S.memberName}>{m.FullName}</span>
                    <span style={S.memberRole}>— {m.RoleName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          ...S.toast,
          background: toast.ok ? "rgba(16,185,129,0.13)" : "rgba(239,68,68,0.13)",
          color: toast.ok ? "#34d399" : "#f87171",
          border: `1px solid ${toast.ok ? "rgba(52,211,153,0.28)" : "rgba(248,113,113,0.28)"}`,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}