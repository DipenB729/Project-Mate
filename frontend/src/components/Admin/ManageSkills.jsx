import { API } from '../../api/client';
import React, { useEffect, useState } from 'react';
import axios from '../../api/client';
import Navbar from '../Navbar';

const ManageSkills = () => {
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState("");
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
        const res = await axios.get(`${API}/skills`);
        setSkills(Array.isArray(res.data) ? res.data : []);
            setError('');
        } catch { setError('Unable to load data. Please refresh to retry.'); }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/admin/skills`, { skillName: newSkill });
            setNewSkill("");
            fetchSkills();
        } catch (err) {
            alert(err.response?.data?.message || "Error adding skill");
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Are you sure? This might affect student profiles.")){
            try { await axios.delete(`${API}/admin/skills/${id}`);
            await fetchSkills();
            } catch { setError('Unable to delete skill. It may be in use.'); }
        }
    };

    return (
        <div className="admin-layout">
            <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className={`admin-content ${!isSidebarOpen ? 'expanded' : ''}`}>
                <h2>Master Skill List</h2>
                {error && <p role="alert">{error}</p>}

                {/* Add Skill Form */}
                <form onSubmit={handleAddSkill} style={{marginBottom: '30px', display: 'flex', gap: '10px'}}>
                    <input
                        type="text"
                        placeholder="e.g. Machine Learning, Figma..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="admin-search" // Reusing styles
                        required
                    />
                    <button type="submit" className="btn-activate" style={{padding: '10px 20px'}}>Add Skill</button>
                </form>

                <div className="grid-container">
                    {skills.map(skill => (
                        <div key={skill.SkillId} className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px'}}>
                            <span>{skill.SkillName}</span>
                            <button
                                onClick={() => handleDelete(skill.SkillId)}
                                style={{background: 'none', border: 'none', color: 'red', cursor: 'pointer'}}
                            >
                                ✖
                            </button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ManageSkills;
