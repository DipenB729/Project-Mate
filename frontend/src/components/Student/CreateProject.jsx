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
  header: {
    background: "rgba(15,23,42,0.95)",
    borderBottom: "1px solid rgba(251,191,36,0.2)",
    padding: "1.2rem 2.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(12px)",
  },
  logo: { fontSize: "1.5rem", fontWeight: "700", color: "#fbbf24", letterSpacing: "0.05em" },
  container: { maxWidth: "760px", margin: "0 auto", padding: "3rem 2rem" },
  pageTitle: { fontSize: "2.5rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.4rem", letterSpacing: "-0.02em" },
  pageSubtitle: { color: "#94a3b8", fontSize: "1rem", marginBottom: "2.5rem", fontStyle: "italic" },
  card: {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(251,191,36,0.12)",
    borderRadius: "18px",
    padding: "2.5rem",
    backdropFilter: "blur(8px)",
  },
  fieldGroup: { marginBottom: "1.5rem" },
  label: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: "700",
    letterSpacing: "0.1em",
    color: "#fbbf24",
    textTransform: "uppercase",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(251,191,36,0.2)",
    background: "rgba(15,23,42,0.7)",
    color: "#e2e8f0",
    fontSize: "0.98rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  textarea: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(251,191,36,0.2)",
    background: "rgba(15,23,42,0.7)",
    color: "#e2e8f0",
    fontSize: "0.98rem",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "120px",
    outline: "none",
    boxSizing: "border-box",
  },
  divider: { borderColor: "rgba(255,255,255,0.06)", margin: "2rem 0" },
  sectionTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#f1f5f9", marginBottom: "1.2rem" },
  roleCard: {
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "1.2rem",
    marginBottom: "0.8rem",
    position: "relative",
  },
  roleRow: { display: "flex", gap: "0.8rem", alignItems: "flex-end" },
  select: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(251,191,36,0.2)",
    background: "rgba(15,23,42,0.7)",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    appearance: "none",
    cursor: "pointer",
  },
  addRoleBtn: {
    padding: "0.7rem 1.4rem",
    borderRadius: "10px",
    border: "1.5px dashed rgba(251,191,36,0.35)",
    background: "transparent",
    color: "#fbbf24",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginTop: "0.5rem",
    transition: "all 0.2s",
    letterSpacing: "0.03em",
  },
  removeBtn: {
    position: "absolute",
    top: "0.8rem",
    right: "0.8rem",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "1rem",
    cursor: "pointer",
  },
  submitBtn: {
    marginTop: "2rem",
    padding: "0.9rem 2.5rem",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    color: "#0f172a",
    fontWeight: "700",
    fontSize: "1.05rem",
    cursor: "pointer",
    width: "100%",
    letterSpacing: "0.03em",
    transition: "opacity 0.2s",
  },
  toast: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "0.95rem",
    zIndex: 999,
    animation: "fadeIn 0.3s ease",
  },
  successBox: {
    textAlign: "center",
    padding: "3rem",
    animation: "fadeIn 0.4s ease",
  },
  successIcon: { fontSize: "3.5rem", marginBottom: "1rem" },
  successTitle: { fontSize: "1.6rem", fontWeight: "700", color: "#34d399", marginBottom: "0.5rem" },
  successMsg: { color: "#94a3b8", marginBottom: "1.5rem", lineHeight: "1.6" },
  backBtn: {
    padding: "0.7rem 1.8rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(251,191,36,0.4)",
    background: "transparent",
    color: "#fbbf24",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
};

export default function CreateProject() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState([]);
  const [roles, setRoles] = useState([{ roleName: "", requiredSkillId: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch(`${API}/skills`)
      .then(r => r.json())
      .then(setSkills)
      .catch(() => {});
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const addRole = () =>
    setRoles([...roles, { roleName: "", requiredSkillId: "" }]);

  const updateRole = (i, field, value) => {
    const updated = [...roles];
    updated[i][field] = value;
    setRoles(updated);
  };

  const removeRole = (i) =>
    setRoles(roles.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      showToast("Title and description are required.", false);
      return;
    }
    if (roles.some(r => !r.roleName.trim())) {
      showToast("Please fill in all role names.", false);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          leaderId: user.id,
          roles: roles.map(r => ({
            roleName: r.roleName,
            requiredSkillId: r.requiredSkillId || null,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        showToast(data.error || "Failed to create project", false);
      }
    } catch {
      showToast("Network error", false);
    }
    setSubmitting(false);
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .field-input:focus { border-color: rgba(251,191,36,0.55) !important; }
        .add-role-btn:hover { background: rgba(251,191,36,0.07) !important; border-color: rgba(251,191,36,0.6) !important; }
        .submit-btn:hover { opacity: 0.88; }
      `}</style>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Create a Project</h1>
        <p style={styles.pageSubtitle}>Post your idea and find teammates with the right skills.</p>

        <div style={styles.card}>
          {success ? (
            <div style={styles.successBox}>
              <div style={styles.successIcon}>✦</div>
              <div style={styles.successTitle}>Project Submitted!</div>
              <p style={styles.successMsg}>
                Your project has been submitted for admin approval.<br />
                Once approved, other students can discover and apply to join.
              </p>
              <button style={styles.backBtn} onClick={() => { setSuccess(false); setTitle(""); setDescription(""); setRoles([{ roleName: "", requiredSkillId: "" }]); }}>
                + Create Another
              </button>
            </div>
          ) : (
            <>
              {/* Project Info */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Project Title</label>
                <input
                  className="field-input"
                  style={styles.input}
                  placeholder="e.g., AI-Powered Study Planner"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  className="field-input"
                  style={styles.textarea}
                  placeholder="Describe your project idea, goals, and what you plan to build..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <hr style={styles.divider} />

              {/* Roles Section */}
              <div style={styles.sectionTitle}>Roles You Need to Fill</div>
              {roles.map((role, i) => (
                <div key={i} style={styles.roleCard}>
                  {roles.length > 1 && (
                    <button style={styles.removeBtn} onClick={() => removeRole(i)}>✕</button>
                  )}
                  <div style={styles.roleRow}>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...styles.label, marginBottom: "0.4rem" }}>Role Name</label>
                      <input
                        className="field-input"
                        style={styles.input}
                        placeholder="e.g., Frontend Developer, UI Designer"
                        value={role.roleName}
                        onChange={e => updateRole(i, "roleName", e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...styles.label, marginBottom: "0.4rem" }}>Required Skill</label>
                      <select
                        className="field-input"
                        style={styles.select}
                        value={role.requiredSkillId}
                        onChange={e => updateRole(i, "requiredSkillId", e.target.value)}
                      >
                        <option value="">— Any / Optional —</option>
                        {skills.map(s => (
                          <option key={s.SkillId} value={s.SkillId}>{s.SkillName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button className="add-role-btn" style={styles.addRoleBtn} onClick={addRole}>
                + Add Another Role
              </button>

              <button
                className="submit-btn"
                style={styles.submitBtn}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Project for Approval →"}
              </button>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          color: toast.ok ? "#34d399" : "#f87171",
          border: `1px solid ${toast.ok ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}