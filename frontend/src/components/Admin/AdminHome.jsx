import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar';
import client, { API } from '../../api/client';
import '../../styles/Home.css';
export default function AdminHome() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        client.get(`${API}/projects/admin/stats`).then(res => setStats(res.data))
            .catch(() => setError('Unable to load dashboard. Please refresh to retry.'));
    }, []);
    return <div className="admin-layout">
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className={`admin-content ${!isSidebarOpen ? 'expanded' : ''}`}>
            <h1>Admin Overview</h1>
            {error && <p role="alert">{error}</p>}
            {!stats && !error && <p>Loading dashboard...</p>}
            {stats && <div className="grid-container">
                <div className="card"><h3>Active Students</h3><h2>{stats.activeStudents}</h2></div>
                <div className="card"><h3>Project Proposals</h3><h2>{stats.pendingProjects}</h2></div>
                <div className="card"><h3>Approved Projects</h3><h2>{stats.approvedProjects}</h2></div>
            </div>}
        </main>
    </div>;
}
