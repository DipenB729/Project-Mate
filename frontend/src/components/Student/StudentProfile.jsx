import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../Navbar';

const API = "http://localhost:5000/api";

const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: "#e2e8f0",
  },
  container: { maxWidth: "860px", margin: "0 auto", padding: "3rem 2rem" },
  pageTitle: { fontSize: "2.4rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.3rem", letterSpacing: "-0.02em" },
  pageSub: { color: "#94a3b8", fontSize: "0.97rem", marginBottom: "2.5rem", fontStyle: "italic" },
  card: {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "18px",
    padding: "2.2rem",
    backdropFilter: "blur(8px)",
    marginBottom: "1.5rem",
  },
  sectionLabel: {
    fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.13em",
    color: "#fbbf24", textTransform: "uppercase", marginBottom: "1rem",
  },
  searchWrap: { position: "relative", marginBottom: "1.5rem" },
  searchInput: {
    width: "100%",
    padding: "0.8rem 1rem 0.8rem 2.6rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(251,191,36,0.18)",
    background: "rgba(15,23,42,0.7)",
    color: "#e2e8f0",
    fontSize: "0.93rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  searchIcon: {
    position: "absolute", left: "0.85rem", top: "50%",
    transform: "translateY(-50%)", color: "#475569", fontSize: "0.9rem",
    pointerEvents: "none",
  },
  skillsGrid: { display: "flex", flexWrap: "wrap", gap: "0.55rem" },
  skillBtn: {
    padding: "0.45rem 1rem",
    borderRadius: "22px",
    fontSize: "0.82rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.18s",
    fontFamily: "inherit",
    letterSpacing: "0.02em",
    border: "1.5px solid",
  },
  skillActive: {
    background: "rgba(251,191,36,0.14)",
    color: "#fbbf24",
    borderColor: "rgba(251,191,36,0.45)",
  },
  skillInactive: {
    background: "rgba(30,41,59,0.5)",
    color: "#64748b",
    borderColor: "rgba(255,255,255,0.07)",
  },
  selectedSection: {
    background: "rgba(15,23,42,0.5)",
    border: "1px solid rgba(251,191,36,0.12)",
    borderRadius: "12px",
    padding: "1rem 1.2rem",
    marginTop: "1.5rem",
  },
  selectedLabel: { fontSize: "0.72rem", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.7rem" },
  selectedWrap: { display: "flex", flexWrap: "wrap", gap: "0.45rem" },
  selectedTag: {
    display: "flex", alignItems: "center", gap: "0.4rem",
    padding: "0.3rem 0.8rem",
    borderRadius: "20px",
    background: "rgba(251,191,36,0.1)",
    color: "#fbbf24",
    border: "1px solid rgba(251,191,36,0.28)",
    fontSize: "0.8rem", fontWeight: "600",
  },
  removeTag: {
    background: "none", border: "none", color: "#94a3b8",
    cursor: "pointer", padding: "0", fontSize: "0.85rem",
    lineHeight: 1, transition: "color 0.15s",
  },
  saveBtn: {
    marginTop: "2rem",
    padding: "0.85rem 2.5rem",
    borderRadius: "11px",
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
  toast: {
    position: "fixed", bottom: "2rem", right: "2rem",
    padding: "0.9rem 1.4rem", borderRadius: "12px",
    fontWeight: "600", fontSize: "0.93rem", zIndex: 999,
    animation: "fadeIn 0.3s ease",
  },
  emptySearch: { color: "#475569", fontSize: "0.88rem", fontStyle: "italic", padding: "1rem 0" },
};

export default function StudentProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [allSkills, setAllSkills] = useState([]);
  const [mySkillIds, setMySkillIds] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resAll, resMine] = await Promise.all([
          axios.get(`${API}/skills`),
          axios.get(`${API}/student/my-skills/${user.id}`),
        ]);
        setAllSkills(resAll.data);
        setMySkillIds(resMine.data.map(s => s.SkillId));
      } catch {
        showToast("Failed to load skills", false);
      }
    };
    loadData();
  }, [user.id]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSkill = (id) => {
    setMySkillIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const saveSkills = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/student/update-skills`, {
        userId: user.id,
        skillIds: mySkillIds,
      });
      showToast("Skills saved successfully!");
    } catch {
      showToast("Failed to save skills", false);
    }
    setLoading(false);
  };

  const filteredSkills = allSkills.filter(s =>
    s.SkillName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSkills = allSkills.filter(s => mySkillIds.includes(s.SkillId));

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .skill-btn-inactive:hover { border-color:rgba(251,191,36,0.3)!important; color:#94a3b8!important; }
        .skill-btn-active:hover { opacity:0.8; }
        .remove-tag:hover { color:#f87171!important; }
        .search-inp:focus { border-color:rgba(251,191,36,0.5)!important; }
        .save-btn:hover { opacity:0.86; }
      `}</style>

      <Navbar />

      <div style={{ ...S.container, animation: "fadeUp 0.35s ease" }}>
        <h1 style={S.pageTitle}>Technical Profile</h1>
        <p style={S.pageSub}>Select your skills to get matched with the right projects.</p>

        <div style={S.card}>
          <div style={S.sectionLabel}>Browse & Select Skills</div>

          {/* Search */}
          <div style={S.searchWrap}>
            <span style={S.searchIcon}>⌕</span>
            <input
              className="search-inp"
              style={S.searchInput}
              placeholder="Search skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Skills grid */}
          {filteredSkills.length === 0 ? (
            <div style={S.emptySearch}>No skills match "{search}"</div>
          ) : (
            <div style={S.skillsGrid}>
              {filteredSkills.map(skill => {
                const active = mySkillIds.includes(skill.SkillId);
                return (
                  <button
                    key={skill.SkillId}
                    className={active ? "skill-btn-active" : "skill-btn-inactive"}
                    style={{ ...S.skillBtn, ...(active ? S.skillActive : S.skillInactive) }}
                    onClick={() => toggleSkill(skill.SkillId)}
                  >
                    {skill.SkillName} {active ? "✓" : "+"}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected skills summary */}
          {selectedSkills.length > 0 && (
            <div style={{ ...S.selectedSection, animation: "fadeIn 0.25s ease" }}>
              <div style={S.selectedLabel}>{selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected</div>
              <div style={S.selectedWrap}>
                {selectedSkills.map(s => (
                  <span key={s.SkillId} style={S.selectedTag}>
                    {s.SkillName}
                    <button
                      className="remove-tag"
                      style={S.removeTag}
                      onClick={() => toggleSkill(s.SkillId)}
                    >✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            className="save-btn"
            style={S.saveBtn}
            onClick={saveSkills}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save My Skills →"}
          </button>
        </div>
      </div>

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