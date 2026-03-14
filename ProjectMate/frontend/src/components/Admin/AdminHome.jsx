import React, { useState } from 'react';
import Navbar from '../Navbar';
import '../../styles/Home.css';

const AdminHome = () => {
    // State to track sidebar toggle
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="admin-layout">
            {/* Pass state and setter to Navbar */}
            <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            
            <main className={`admin-content ${!isSidebarOpen ? 'expanded' : ''}`}>
                <h1>Admin Overview</h1>
                <p>Welcome to the control center. Use the menu to manage the platform.</p>
                
                <div className="grid-container">
                    <div className="card"><h3>Active Students</h3><h2>142</h2></div>
                    <div className="card"><h3>Project Proposals</h3><h2>28</h2></div>
                    <div className="card"><h3>Reports</h3><h2>2</h2></div>
                </div>
            </main>
        </div>
    );
};

export default AdminHome;