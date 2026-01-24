import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../Navbar';
import '../../styles/Home.css';

const ProfileSettings = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [formData, setFormData] = useState({ fullName: '', address: '', existingPic: '' });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('https://via.placeholder.com/150');
    console.log(user.Id);
    useEffect(() => {
        const fetchDetails = async () => {
            const res = await axios.get(`http://localhost:5000/api/user/details/${user.id}`);
            setFormData({ 
                fullName: res.data.FullName, 
                address: res.data.Address || '', 
                existingPic: res.data.ProfilePic || '' 
            });
            if (res.data.ProfilePic) {
                setPreview(`http://localhost:5000${res.data.ProfilePic}`);
            }
        };
        fetchDetails();
    }, [user.id]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile)); // Show preview instantly
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const data = new FormData(); // Use FormData for file uploads
        data.append('userId', user.id);
        data.append('fullName', formData.fullName);
        data.append('address', formData.address);
        data.append('existingPic', formData.existingPic);
        if (file) data.append('profilePic', file);

        try {
            const res = await axios.put('http://localhost:5000/api/user/update-profile', data);
            alert("Profile updated!");
            
            // Update localStorage so the Navbar name changes too
            const updatedUser = { ...user, name: res.data.fullName };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload(); 
        } catch (err) {
            alert("Update failed");
        }
    };

    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="content">
                <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
                    <h2>Profile Settings</h2>
                    <form onSubmit={handleUpdate}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <img src={preview} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }} />
                            <br />
                            <input type="file" onChange={handleFileChange} style={{ marginTop: '10px' }} />
                        </div>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" className="register-input" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                        </div>

                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Address</label>
                            <input type="text" className="register-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="City, Country" />
                        </div>

                        <button type="submit" className="register-button" style={{ marginTop: '20px' }}>Save Changes</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;