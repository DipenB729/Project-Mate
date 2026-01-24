import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import from new subfolders
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import StudentHome from './components/Student/StudentHome';
import AdminHome from './components/Admin/AdminHome';
import ManageUsers from './components/Admin/ManageUsers'; 
import ManageSkills from './components/Admin/ManageSkills';
import StudentProfile from './components/Student/StudentProfile';
import ProfileSettings from './components/Student/ProfileSettings';
// Simple Route Guard
const PrivateRoute = ({ children, role }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return <Navigate to="/" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Auth Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Student Protected Routes */}
                <Route path="/student-home" element={
                    <PrivateRoute role="Student">
                        <StudentHome />
                    </PrivateRoute>
                } />
                <Route path="/student-profile" element={
                      <PrivateRoute role="Student">
                      <StudentProfile />
                    </PrivateRoute>
                } />
               <Route path="/profile-settings" element={
                <PrivateRoute role="Student">
                 <ProfileSettings />
                </PrivateRoute>
               } />


                {/* Admin Protected Routes */}
                <Route path="/admin-home" element={
                    <PrivateRoute role="Admin">
                        <AdminHome />
                    </PrivateRoute>
                } />
                <Route path="/manage-users" element={
                      <PrivateRoute role="Admin">
                        <ManageUsers />
                    </PrivateRoute>
                } />
                <Route path="/manage-skills" element={
                    <PrivateRoute role="Admin">
                        <ManageSkills />
                    </PrivateRoute>
                } />    
                <Route path="/manage-skills" element={
                <PrivateRoute role="Admin">
                         <ManageSkills />
                      </PrivateRoute>
                } />     
            </Routes>
        </Router>
    );
}

export default App;