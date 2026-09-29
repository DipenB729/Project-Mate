import { API } from '../../api/client';
import React, { useEffect, useState } from 'react';
import axios from '../../api/client';
import Navbar from '../Navbar';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
        const res = await axios.get(`${API}/admin/users`);
        setUsers(Array.isArray(res.data) ? res.data : []);
            setError('');
        } catch { setError('Unable to load data. Please refresh to retry.'); }
    };

    const toggleStatus = async (userId, currentStatus) => {
        try { await axios.put(`${API}/admin/users/status`, {
            userId,
            isActive: !currentStatus
        });
        await fetchUsers();
        } catch { setError('Unable to update user. Please try again.'); }
    };

    return (
        <div className="admin-layout">
            <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className={`admin-content ${!isSidebarOpen ? 'expanded' : ''}`}>
                <h2>User Management</h2>
                {error && <p role="alert">{error}</p>}
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.UserId}>
                                <td>{user.FullName}</td>
                                <td>{user.Email}</td>
                                <td>
                                   <span className={user.IsActive && !user.IsDeleted ? 'badge-active' : 'badge-suspended'}>
                                        {user.IsActive && !user.IsDeleted ? 'Active' : 'Suspended'}
                                    </span>
                                </td>
                                <td>
                                   <button
                                   className={user.IsActive && !user.IsDeleted ? 'btn-suspend' : 'btn-activate'}
                               onClick={() => toggleStatus(user.UserId, user.IsActive && !user.IsDeleted)}>
                                      {user.IsActive && !user.IsDeleted ? 'Suspend' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
};

export default ManageUsers;
