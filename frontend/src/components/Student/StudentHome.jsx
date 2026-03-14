import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';

const API = "http://localhost:5000/api";

const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#e2e8f0",
  },
  container: { maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem" },
  welcome: {
    marginBottom: "2.8rem",
  },
  welcomeEyebrow: {
    fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.14em",
    color: "#fbbf24", textTransform: "uppercase", marginBottom: "0.5rem",
  },
  welcomeTitle: {
    fontSize: "2.6rem", fontWeight: "700", color: "#f8fafc",
    letterSpacing: "-0.02em", marginBottom: "0.4rem",
    lineHeight: 1.2,
  },
  welcomeSub: { color: "#64748b", fontSize: "1rem", fontStyle: "italic" },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
    marginBottom: "2.5rem",
  },
  statCard: {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "1.4rem 1.6rem",
    backdropFilter: "blur(8px)",
    position: "relative",
    overflow: "hidden",
  },
  statNum: { fontSize: "2.2rem", fontWeight: "700", marginBottom: "0.2rem" },
  statLabel: { fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" },
  statAccent: {
    position: "absolute", bottom: 0, left: 0,
    height: "3px", width: "100%",
  },
  sectionTitle: {
    fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em",
    color: "#fbbf24", textTransform: "uppercase", marginBottom: "1.2rem",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.2rem",
    marginBottom: "2.8rem",
  },
  actionCard: {
    background: "rgba(30,41,59,0.65)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "1.8rem",
    cursor: "pointer",
    transition: "all 0.22s ease",
    backdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    textDecoration: "none",
  },
  actionIcon: { fontSize: "1.8rem", lineHeight: 1 },
  actionTitle: { fontWeight: "700", fontSize: "1.05rem", color: "#f1f5f9" },
  actionDesc: { fontSize: "0.85rem", color: "#64748b", lineHeight: "1.5" },
  actionArrow: { color: "#fbbf24", fontSize: "0.9rem", marginTop: "auto", fontWeight: "700" },
  skillsSection: {
    background: "rgba(30,41,59,0.65)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "1.8rem",
    backdropFilter: "blur(6px)",
  },
  skillsWrap: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.8rem" },
  skillTag: {
    fontSize: "0.8rem", padding: "0.3rem 0.85rem", borderRadius: "20px",
    background: "rgba(251,191,36,0.1)", color: "#fbbf24",
    border: "1px solid rgba(251,191,36,0.25)", fontWeight: "600",
  },
  noSkills: { color: "#475569", fontSize: "0.9rem", fontStyle: "italic" },
  editSkillsLink: {
    display: "inline-block", marginTop: "1rem",
    fontSize: "0.82rem", color: "#fbbf24",
    cursor: "pointer", fontWeight: "600",
    textDecoration: "underline", textUnderlineOffset: "3px",
  },
};

const actions = [
  { icon: "◈", title: "Browse Projects", desc: "Discover open projects and find your next team.", path: "/browse-projects" },
  { icon: "✦", title: "Create a Project", desc: "Post your idea and recruit teammates.", path: "/create-project" },
  { icon: "◌", title: "My Applications", desc: "Track the status of roles you applied for.", path: "/my-applications" },
  { icon: "⬡", title: "My Projects", desc: "Manage projects you lead and review requests.", path: "/my-projects" },
];

export default function StudentHome() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const [mySkills, setMySkills] = useState([]);
  const [stats, setStats] = useState({ projects: 0, applications: 0, teams: 0 });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!user.id) return;
    // Load my skills
    fetch(`${API}/student/my-skills/${user.id}`)
      .then(r => r.json()).then(setMySkills).catch(() => {});
    // Load stats
    Promise.all([
      fetch(`${API}/projects/my-projects/${user.id}`).then(r => r.json()),
      fetch(`${API}/interests/my-applications/${user.id}`).then(r => r.json()),
      fetch(`${API}/interests/my-team/${user.id}`).then(r => r.json()),
    ]).then(([projs, apps, teams]) => {
      setStats({
        projects: projs.length || 0,
        applications: apps.length || 0,
        teams: teams.length || 0,
      });
    }).catch(() => {});
  }, [user.id]);

  const statItems = [
    { num: stats.projects,     label: "Projects Created", color: "#fbbf24", grad: "linear-gradient(90deg,#fbbf24,#f59e0b)" },
    { num: stats.applications, label: "Applications Sent", color: "#818cf8", grad: "linear-gradient(90deg,#818cf8,#6366f1)" },
    { num: stats.teams,        label: "Teams Joined",     color: "#34d399", grad: "linear-gradient(90deg,#34d399,#10b981)" },
    { num: mySkills.length,    label: "Skills Listed",    color: "#38bdf8", grad: "linear-gradient(90deg,#38bdf8,#0ea5e9)" },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .action-card:hover { transform:translateY(-5px); border-color:rgba(251,191,36,0.28)!important; box-shadow:0 16px 36px rgba(0,0,0,0.35); }
        .stat-card { animation: fadeUp 0.4s ease both; }
      `}</style>

      <Navbar />

      <div style={S.container}>
        {/* Welcome */}
        <div style={{ ...S.welcome, animation: "fadeUp 0.35s ease" }}>
          <div style={S.welcomeEyebrow}>{greeting}</div>
          <h1 style={S.welcomeTitle}>Welcome back, {user.name?.split(" ")[0] || "Student"} ✦</h1>
          <p style={S.welcomeSub}>Here's what's happening with your projects today.</p>
        </div>

        {/* Stats */}
        <div style={S.statsRow}>
          {statItems.map((s, i) => (
            <div key={i} className="stat-card" style={{ ...S.statCard, animationDelay: `${i * 0.07}s` }}>
              <div style={{ ...S.statNum, color: s.color }}>{s.num}</div>
              <div style={S.statLabel}>{s.label}</div>
              <div style={{ ...S.statAccent, background: s.grad }} />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={S.sectionTitle}>Quick Actions</div>
        <div style={S.actionsGrid}>
          {actions.map((a, i) => (
            <div
              key={i}
              className="action-card"
              style={{ ...S.actionCard, animationDelay: `${0.28 + i * 0.07}s`, animation: "fadeUp 0.4s ease both" }}
              onClick={() => navigate(a.path)}
            >
              <div style={S.actionIcon}>{a.icon}</div>
              <div style={S.actionTitle}>{a.title}</div>
              <div style={S.actionDesc}>{a.desc}</div>
              <div style={S.actionArrow}>→</div>
            </div>
          ))}
        </div>

        {/* My Skills Preview */}
        <div style={{ ...S.skillsSection, animation: "fadeUp 0.4s 0.55s ease both" }}>
          <div style={S.sectionTitle}>My Skills</div>
          {mySkills.length > 0 ? (
            <div style={S.skillsWrap}>
              {mySkills.map(s => (
                <span key={s.SkillId} style={S.skillTag}>{s.SkillName}</span>
              ))}
            </div>
          ) : (
            <div style={S.noSkills}>You haven't added any skills yet.</div>
          )}
          <span style={S.editSkillsLink} onClick={() => navigate("/student-profile")}>
            {mySkills.length > 0 ? "Edit skills →" : "Add skills now →"}
          </span>
        </div>
      </div>
    </div>
  );
}