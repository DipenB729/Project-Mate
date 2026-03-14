import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';

// Added props for sidebar toggle logic
const Navbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [showDropdown, setShowDropdown] = useState(false);
    const [profilePic, setProfilePic] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/user/details/${user.id}`);
                if (res.data.ProfilePic) {
                    setProfilePic(`http://localhost:5000${res.data.ProfilePic}`);
                }
            } catch (err) {
                console.error("Error fetching navbar profile pic", err);
            }
        };
        if (user) fetchUserData();
    }, [user.id]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    // ============================================================
    // 1. ADMIN PANEL (SIDEWAYS NAVBAR + TOP DROPDOWN)
    // ============================================================
    if (user?.role === 'Admin') {
        return (
            <>
                {/* Admin Sidebar */}
                <aside className={`admin-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <h2 style={{ padding: '20px', color: 'white' }}>PM Admin</h2>
                    </div>
                    <div className="sidebar-links">
                        <Link to="/admin-home" className="sidebar-link">📊 Dashboard</Link>
                        <Link to="/manage-users" className="sidebar-link">👥 Manage Users</Link>
                        <Link to="/manage-skills" className="sidebar-link">🛠 Manage Skills</Link>
                    </div>
                     
                </aside>

                {/* Admin Top Header (For Toggle & Profile Dropdown) */}
                <header className={`admin-top-header ${!isSidebarOpen ? 'expanded' : ''}`}>
                    <button className="toggle-btn-new" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? '✖' : '☰'}
                    </button>

                    <div className="nav-right-section">
                        <div className="notification-bell">
                            🔔<span className="bell-badge">3</span>
                        </div>
                        <div className="profile-dropdown-container">
                            <img 
                                src={profilePic || "https://via.placeholder.com/40"} 
                                alt="Profile" 
                                className="navbar-avatar" 
                                onClick={() => setShowDropdown(!showDropdown)}
                            />
                            {showDropdown && (
                                <div className="dropdown-card">
                                    <div className="dropdown-user-info">
                                        <h4>{user?.name}</h4>
                                        <p>{user?.role}</p>
                                    </div>
                                    <Link to="/profile-settings" className="dropdown-action-item" onClick={() => setShowDropdown(false)}>
                                        ⚙ Manage profile
                                    </Link>
                                    <button className="dropdown-action-item">🔄 Reset Password</button>
                                    <button className="dropdown-action-item logout-text" onClick={handleLogout}>
                                        ↪ Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            </>
        );
    }

    // ============================================================
    // 2. STUDENT PANEL (TOP HORIZONTAL - UNCHANGED AS REQUESTED)
    // ============================================================
    return (
        <nav className="student-navbar">
            {/* Left Side: Branding and Links */}
            <div className="nav-links-left">
                <h2 style={{ color: '#2563eb', cursor: 'pointer', marginRight: '20px' }} onClick={() => navigate('/student-home')}>
                    Project-Mate
                </h2>
                <Link to="/student-home" className="nav-link-item">Home</Link>
                <Link to="/student-profile" className="nav-link-item">My Skills</Link>
                <Link to="/student-home" className="nav-link-item">Post Vision</Link>
            </div>

            {/* Right Side: Welcome, Notifications, and Profile Dropdown */}
            <div className="nav-right-section">
                <span style={{ color: '#64748b', fontSize: '14px' }}>
                    Welcome <b>{user?.name}</b> 👋
                </span>

                <div className="notification-bell">
                    🔔<span className="bell-badge">6</span>
                </div>

                <div className="profile-dropdown-container">
                    <img 
                        src={profilePic || "https://via.placeholder.com/40"} 
                        alt="Profile" 
                        className="navbar-avatar" 
                        onClick={() => setShowDropdown(!showDropdown)}
                    />

                    {showDropdown && (
                        <div className="dropdown-card">
                            <div className="dropdown-user-info">
                                <h4>{user?.name}</h4>
                                <p>{user?.role}</p>
                            </div>
                            
                            <Link to="/profile-settings" className="dropdown-action-item" onClick={() => setShowDropdown(false)}>
                                ⚙ Manage profile
                            </Link>
                            
                            <button className="dropdown-action-item">
                                🔄 Reset Password
                            </button>
                            
                            <button className="dropdown-action-item logout-text" onClick={handleLogout}>
                                ↪ Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;