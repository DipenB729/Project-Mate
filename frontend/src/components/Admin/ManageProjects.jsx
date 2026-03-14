import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../Navbar';

const API = "http://localhost:5000/api";

const ManageProjects = () => {
    const [projects, setProjects]       = useState([]);
    const [filtered, setFiltered]       = useState([]);
    const [search,   setSearch]         = useState("");
    const [filter,   setFilter]         = useState("All");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selected, setSelected]       = useState(null); // detail modal
    const [toast,    setToast]          = useState(null);

    useEffect(() => { fetchProjects(); }, []);

    useEffect(() => {
        let list = projects;
        if (filter === "Pending")  list = list.filter(p => !p.IsApproved);
        if (filter === "Approved") list = list.filter(p => p.IsApproved);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.Title.toLowerCase().includes(q) ||
                p.LeaderName.toLowerCase().includes(q) ||
                p.Description.toLowerCase().includes(q)
            );
        }
        setFiltered(list);
    }, [projects, filter, search]);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API}/projects/admin/all`);
            setProjects(res.data);
        } catch (err) {
            showToast("Failed to load projects", false);
        }
    };

    const handleApprove = async (projectId) => {
        try {
            await axios.put(`${API}/projects/admin/approve/${projectId}`);
            showToast("Project approved and is now live!");
            fetchProjects();
            setSelected(null);
        } catch {
            showToast("Failed to approve project", false);
        }
    };

    const handleReject = async (projectId) => {
        if (!window.confirm("Are you sure you want to reject this project?")) return;
        try {
            await axios.put(`${API}/projects/admin/reject/${projectId}`);
            showToast("Project rejected.");
            fetchProjects();
            setSelected(null);
        } catch {
            showToast("Failed to reject project", false);
        }
    };

    const openDetail = async (proj) => {
        try {
            const res = await axios.get(`${API}/projects/${proj.ProjectId}`);
            setSelected(res.data);
        } catch {
            showToast("Failed to load project details", false);
        }
    };

    const showToast = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const counts = {
        All:      projects.length,
        Pending:  projects.filter(p => !p.IsApproved).length,
        Approved: projects.filter(p =>  p.IsApproved).length,
    };

    return (
        <div className="admin-layout">
            <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

            <main className={`admin-content ${!isSidebarOpen ? 'expanded' : ''}`}>
                <h2>Manage Projects</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                    Review and approve student project submissions before they go live.
                </p>

                {/* Stats row */}
                <div className="grid-container" style={{ marginBottom: '24px' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#64748b', fontSize: '13px', margin: '0 0 6px' }}>TOTAL</h3>
                        <h2 style={{ margin: 0, fontSize: '2rem' }}>{counts.All}</h2>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#f59e0b', fontSize: '13px', margin: '0 0 6px' }}>PENDING</h3>
                        <h2 style={{ margin: 0, fontSize: '2rem', color: '#f59e0b' }}>{counts.Pending}</h2>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#10b981', fontSize: '13px', margin: '0 0 6px' }}>APPROVED</h3>
                        <h2 style={{ margin: 0, fontSize: '2rem', color: '#10b981' }}>{counts.Approved}</h2>
                    </div>
                </div>

                {/* Search + Filter */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <input
                        className="admin-search"
                        placeholder="Search by title, leader..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {["All", "Pending", "Approved"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    transition: 'all 0.18s',
                                    borderColor: filter === f ? '#2563eb' : '#e2e8f0',
                                    background:  filter === f ? '#2563eb' : 'transparent',
                                    color:       filter === f ? '#fff'    : '#64748b',
                                }}
                            >
                                {f} ({counts[f]})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Projects Table */}
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Project Title</th>
                            <th>Leader</th>
                            <th>Roles</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                                    No projects found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map(proj => (
                                <tr key={proj.ProjectId}>
                                    <td>
                                        <span
                                            style={{ fontWeight: '600', color: '#2563eb', cursor: 'pointer' }}
                                            onClick={() => openDetail(proj)}
                                        >
                                            {proj.Title}
                                        </span>
                                    </td>
                                    <td>{proj.LeaderName}</td>
                                    <td>{proj.RoleCount || '—'}</td>
                                    <td>{new Date(proj.CreatedAt).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}</td>
                                    <td>
                                        <span className={proj.IsApproved ? 'badge-active' : 'badge-suspended'}>
                                            {proj.IsApproved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            className="btn-activate"
                                            style={{ padding: '5px 12px', fontSize: '12px' }}
                                            onClick={() => openDetail(proj)}
                                        >
                                            View
                                        </button>
                                        {!proj.IsApproved && (
                                            <button
                                                className="btn-activate"
                                                style={{ padding: '5px 12px', fontSize: '12px', background: '#10b981', borderColor: '#10b981' }}
                                                onClick={() => handleApprove(proj.ProjectId)}
                                            >
                                                ✓ Approve
                                            </button>
                                        )}
                                        {proj.IsApproved && (
                                            <button
                                                className="btn-suspend"
                                                style={{ padding: '5px 12px', fontSize: '12px' }}
                                                onClick={() => handleReject(proj.ProjectId)}
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </main>

            {/* Detail Modal */}
            {selected && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }} onClick={() => setSelected(null)}>
                    <div style={{
                        background: '#fff', borderRadius: '16px',
                        padding: '2rem', maxWidth: '580px', width: '100%',
                        maxHeight: '85vh', overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }} onClick={e => e.stopPropagation()}>

                        <button onClick={() => setSelected(null)} style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            background: 'none', border: 'none', fontSize: '1.3rem',
                            cursor: 'pointer', color: '#94a3b8',
                        }}>✕</button>

                        {/* Header */}
                        <div style={{ marginBottom: '1rem' }}>
                            <span className={selected.IsApproved ? 'badge-active' : 'badge-suspended'}
                                style={{ fontSize: '11px' }}>
                                {selected.IsApproved ? 'Approved' : 'Pending Approval'}
                            </span>
                            <h2 style={{ margin: '0.5rem 0 0.2rem', color: '#1e293b' }}>{selected.Title}</h2>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                                by <strong>{selected.LeaderName}</strong> · {selected.LeaderEmail}
                            </p>
                        </div>

                        <hr style={{ borderColor: '#f1f5f9', margin: '1rem 0' }} />

                        {/* Description */}
                        <p style={{ color: '#475569', lineHeight: '1.7', fontSize: '14px', marginBottom: '1.2rem' }}>
                            {selected.Description}
                        </p>

                        {/* Roles */}
                        {selected.roles?.length > 0 && (
                            <div style={{ marginBottom: '1.2rem' }}>
                                <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em',
                                    color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Roles Needed ({selected.roles.length})
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {selected.roles.map(r => (
                                        <span key={r.RoleId} style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                                            fontWeight: '600',
                                            background: r.IsFilled ? '#f1f5f9' : '#eff6ff',
                                            color:      r.IsFilled ? '#94a3b8'  : '#2563eb',
                                            border:     `1px solid ${r.IsFilled ? '#e2e8f0' : '#bfdbfe'}`,
                                            textDecoration: r.IsFilled ? 'line-through' : 'none',
                                        }}>
                                            {r.RoleName} {r.SkillName ? `· ${r.SkillName}` : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Team Members */}
                        {selected.members?.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em',
                                    color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Current Team ({selected.members.length})
                                </p>
                                {selected.members.map((m, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '6px 0', borderBottom: '1px solid #f8fafc',
                                    }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: '#2563eb', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', fontWeight: '700',
                                        }}>
                                            {m.FullName?.split(' ').map(w => w[0]).join('').slice(0,2)}
                                        </div>
                                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{m.FullName}</span>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>— {m.RoleName}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                            {!selected.IsApproved ? (
                                <>
                                    <button className="btn-activate"
                                        style={{ flex: 1, padding: '10px', background: '#10b981', borderColor: '#10b981' }}
                                        onClick={() => handleApprove(selected.ProjectId)}>
                                        ✓ Approve Project
                                    </button>
                                    <button className="btn-suspend"
                                        style={{ flex: 1, padding: '10px' }}
                                        onClick={() => handleReject(selected.ProjectId)}>
                                        ✕ Reject
                                    </button>
                                </>
                            ) : (
                                <button className="btn-suspend"
                                    style={{ flex: 1, padding: '10px' }}
                                    onClick={() => handleReject(selected.ProjectId)}>
                                    Revoke Approval
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    padding: '0.9rem 1.4rem', borderRadius: '12px',
                    fontWeight: '600', fontSize: '14px', zIndex: 999,
                    background: toast.ok ? '#f0fdf4' : '#fef2f2',
                    color:      toast.ok ? '#16a34a' : '#dc2626',
                    border:     `1px solid ${toast.ok ? '#bbf7d0' : '#fecaca'}`,
                    boxShadow:  '0 4px 16px rgba(0,0,0,0.1)',
                }}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

export default ManageProjects;