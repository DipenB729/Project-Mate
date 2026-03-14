import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../Navbar';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await axios.get('http://localhost:5000/api/admin/users');
        setUsers(res.data);
    };

    const toggleStatus = async (userId, currentStatus) => {
        await axios.put('http://localhost:5000/api/admin/users/status', {
            userId,
            isActive: !currentStatus
        });
        fetchUsers(); // Refresh list
    };

    return (
        <div className="admin-layout">
            <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className={`admin-content ${!isSidebarOpen ? 'expanded' : ''}`}>
                <h2>User Management</h2>
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