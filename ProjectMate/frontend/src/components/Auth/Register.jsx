import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/Register.css'; // Path update for folder structure

const Register = () => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Reset error

        try {
            await axios.post('http://localhost:5000/api/register', formData);
            alert("Registration successful! Redirecting to login...");
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Try a different email.");
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2 className="register-title">Join Project-Mate</h2>
                <p className="register-subtitle">Find the perfect team for your academic projects.</p>
                
                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            className="register-input"
                            placeholder="John Doe" 
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>College Email</label>
                        <input 
                            type="email" 
                            className="register-input"
                            placeholder="name@college.edu" 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            className="register-input"
                            placeholder="Create a strong password" 
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            required 
                        />
                    </div>

                    <button type="submit" className="register-button">Create Account</button>
                </form>

                <p className="register-footer">
                    Already have an account? <Link to="/">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;