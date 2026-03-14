import React, { useState, useEffect } from 'react';
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
  container: { maxWidth: "620px", margin: "0 auto", padding: "3rem 2rem" },
  pageTitle: { fontSize: "2.4rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.3rem", letterSpacing: "-0.02em" },
  pageSub: { color: "#94a3b8", fontSize: "0.97rem", marginBottom: "2.5rem", fontStyle: "italic" },
  card: {
    background: "rgba(30,41,59,0.7)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "18px",
    padding: "2.4rem",
    backdropFilter: "blur(8px)",
  },
  avatarWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "2.2rem",
  },
  avatarRing: {
    width: "110px", height: "110px",
    borderRadius: "50%",
    padding: "3px",
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    marginBottom: "1rem",
  },
  avatarImg: {
    width: "100%", height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    background: "#1e293b",
  },
  uploadBtn: {
    padding: "0.45rem 1.2rem",
    borderRadius: "8px",
    border: "1.5px dashed rgba(251,191,36,0.35)",
    background: "transparent",
    color: "#fbbf24",
    fontSize: "0.82rem",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.18s",
    letterSpacing: "0.03em",
  },
  uploadHint: { color: "#475569", fontSize: "0.75rem", marginTop: "0.4rem" },
  fileInput: { display: "none" },
  divider: { borderColor: "rgba(255,255,255,0.05)", margin: "0.5rem 0 1.8rem" },
  sectionLabel: {
    fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.13em",
    color: "#fbbf24", textTransform: "uppercase", marginBottom: "1.2rem",
  },
  fieldGroup: { marginBottom: "1.4rem" },
  label: {
    display: "block",
    fontSize: "0.78rem", fontWeight: "700", letterSpacing: "0.07em",
    color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.45rem",
  },
  input: {
    width: "100%",
    padding: "0.82rem 1rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(251,191,36,0.18)",
    background: "rgba(15,23,42,0.7)",
    color: "#e2e8f0",
    fontSize: "0.96rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  emailInput: {
    width: "100%",
    padding: "0.82rem 1rem",
    borderRadius: "10px",
    border: "1.5px solid rgba(255,255,255,0.05)",
    background: "rgba(15,23,42,0.4)",
    color: "#475569",
    fontSize: "0.96rem",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    cursor: "not-allowed",
  },
  saveBtn: {
    marginTop: "2rem",
    padding: "0.88rem 2.5rem",
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
  savingState: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
  },
  toast: {
    position: "fixed", bottom: "2rem", right: "2rem",
    padding: "0.9rem 1.4rem", borderRadius: "12px",
    fontWeight: "600", fontSize: "0.93rem", zIndex: 999,
    animation: "fadeIn 0.3s ease",
  },
};

export default function ProfileSettings() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [formData, setFormData] = useState({ fullName: "", address: "", existingPic: "" });
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const fileRef = React.useRef();

  useEffect(() => {
    axios.get(`${API}/user/details/${user.id}`)
      .then(res => {
        setFormData({
          fullName: res.data.FullName || "",
          address:  res.data.Address  || "",
          existingPic: res.data.ProfilePic || "",
        });
        setPreview(res.data.ProfilePic
          ? `http://localhost:5000${res.data.ProfilePic}`
          : null
        );
      })
      .catch(() => showToast("Failed to load profile", false));
  }, [user.id]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) { showToast("Full name is required", false); return; }
    setSaving(true);
    try {
      const data = new FormData();
      data.append("userId",      user.id);
      data.append("fullName",    formData.fullName);
      data.append("address",     formData.address);
      data.append("existingPic", formData.existingPic);
      if (file) data.append("profilePic", file);

      const res = await axios.put(`${API}/user/update-profile`, data);
      showToast("Profile updated successfully!");
      const updatedUser = { ...user, name: res.data.fullName };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // slight delay so user sees the toast before reload
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      showToast("Update failed. Please try again.", false);
    }
    setSaving(false);
  };

  const initials = (name = "") =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .field-inp:focus { border-color:rgba(251,191,36,0.52)!important; }
        .upload-btn:hover { background:rgba(251,191,36,0.07)!important; border-color:rgba(251,191,36,0.6)!important; }
        .save-btn:hover { opacity:0.86; }
      `}</style>

      <Navbar />

      <div style={{ ...S.container, animation: "fadeUp 0.35s ease" }}>
        <h1 style={S.pageTitle}>Profile Settings</h1>
        <p style={S.pageSub}>Keep your profile up to date to attract the right collaborators.</p>

        <div style={S.card}>
          {/* Avatar */}
          <div style={S.avatarWrap}>
            <div style={S.avatarRing}>
              {preview ? (
                <img src={preview} alt="Profile" style={S.avatarImg} />
              ) : (
                <div style={{
                  ...S.avatarImg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2rem", fontWeight: "700", color: "#fbbf24",
                }}>
                  {initials(formData.fullName || user.name)}
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={S.fileInput}
              onChange={handleFileChange}
            />
            <button
              className="upload-btn"
              style={S.uploadBtn}
              onClick={() => fileRef.current.click()}
              type="button"
            >
              {file ? "✓ Photo selected" : "Change Photo"}
            </button>
            <span style={S.uploadHint}>JPG, PNG or GIF · Max 5MB</span>
          </div>

          <hr style={S.divider} />

          <div style={S.sectionLabel}>Account Information</div>

          {/* Full Name */}
          <div style={S.fieldGroup}>
            <label style={S.label}>Full Name</label>
            <input
              className="field-inp"
              style={S.input}
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your full name"
            />
          </div>

          {/* Email (read only) */}
          <div style={S.fieldGroup}>
            <label style={S.label}>Email Address</label>
            <input
              style={S.emailInput}
              value={user.email || ""}
              disabled
              placeholder="Email cannot be changed"
            />
          </div>

          {/* Address */}
          <div style={S.fieldGroup}>
            <label style={S.label}>Location</label>
            <input
              className="field-inp"
              style={S.input}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Kathmandu, Nepal"
            />
          </div>

          <button
            className="save-btn"
            style={S.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving changes..." : "Save Changes →"}
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