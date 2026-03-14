import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../Navbar';
import '../../styles/Home.css';

const StudentProfile = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [allSkills, setAllSkills] = useState([]);
    const [mySkillIds, setMySkillIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const resAll = await axios.get('http://localhost:5000/api/skills');
            const resMine = await axios.get(`http://localhost:5000/api/student/my-skills/${user.id}`);
            
            setAllSkills(resAll.data);
            setMySkillIds(resMine.data.map(s => s.SkillId));
        } catch (err) {
            console.error("Error loading skills");
        }
    };

    const toggleSkill = (id) => {
        if (mySkillIds.includes(id)) {
            setMySkillIds(mySkillIds.filter(sid => sid !== id));
        } else {
            setMySkillIds([...mySkillIds, id]);
        }
    };

    const saveSkills = async () => {
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/student/update-skills', {
                userId: user.id,
                skillIds: mySkillIds
            });
            alert("Skills updated!");
        } catch (err) {
            alert("Failed to save skills");
        }
        setLoading(false);
    };

    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="content">
                <h2>My Technical Profile</h2>
                <p>Select the technologies you are proficient in to get better project matches.</p>
                
                <div className="card" style={{marginTop: '20px'}}>
                    <h3>Select Your Skills</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px'}}>
                        {allSkills.map(skill => (
                            <button 
                                key={skill.SkillId}
                                onClick={() => toggleSkill(skill.SkillId)}
                                className={mySkillIds.includes(skill.SkillId) ? 'skill-tag-active' : 'skill-tag-inactive'}
                            >
                                {skill.SkillName} {mySkillIds.includes(skill.SkillId) ? '✓' : '+'}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        className="register-button" 
                        style={{marginTop: '30px', maxWidth: '200px'}}
                        onClick={saveSkills}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Profile Skills'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;