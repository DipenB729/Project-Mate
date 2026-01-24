import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../Navbar';

const ManageSkills = () => {
    const [skills, setSkills] = useState([]);
    const [newSkill, setNewSkill] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        const res = await axios.get('http://localhost:5000/api/skills');
        setSkills(res.data);
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/admin/skills', { skillName: newSkill });
            setNewSkill("");
            fetchSkills();
        } catch (err) {
            alert(err.response.data.message || "Error adding skill");
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Are you sure? This might affect student profiles.")){
            await axios.delete(`http://localhost:5000/api/admin/skills/${id}`);
            fetchSkills();
        }
    };

    return (
        <div className="admin-layout">
            <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className={`admin-content ${!isSidebarOpen ? 'expanded' : ''}`}>
                <h2>Master Skill List</h2>
                
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