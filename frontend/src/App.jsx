import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import Login    from './components/Auth/Login';
import Register from './components/Auth/Register';

// Student
import StudentHome     from './components/Student/StudentHome';
import StudentProfile  from './components/Student/StudentProfile';
import ProfileSettings from './components/Student/ProfileSettings';
import BrowseProjects  from './components/Student/BrowseProjects';
import CreateProject   from './components/Student/CreateProject';
import MyApplications  from './components/Student/MyApplications';
import MyProjects      from './components/Student/MyProjects';
import Inbox           from './components/Student/Inbox';

// Admin
import AdminHome    from './components/Admin/AdminHome';
import ManageUsers  from './components/Admin/ManageUsers';
import ManageSkills    from './components/Admin/ManageSkills';
import ManageProjects  from './components/Admin/ManageProjects';

// Route Guard
const PrivateRoute = ({ children, role }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return <Navigate to="/" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    return children;
};

const StudentRoute = ({ children }) => <PrivateRoute role="Student">{children}</PrivateRoute>;
const AdminRoute   = ({ children }) => <PrivateRoute role="Admin">{children}</PrivateRoute>;

function App() {
    return (
        <Router>
            <Routes>
                {/* Auth */}
                <Route path="/"         element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Student */}
                <Route path="/student-home"    element={<StudentRoute><StudentHome /></StudentRoute>} />
                <Route path="/browse-projects" element={<StudentRoute><BrowseProjects /></StudentRoute>} />
                <Route path="/create-project"  element={<StudentRoute><CreateProject /></StudentRoute>} />
                <Route path="/my-applications" element={<StudentRoute><MyApplications /></StudentRoute>} />
                <Route path="/my-projects"     element={<StudentRoute><MyProjects /></StudentRoute>} />
                <Route path="/student-profile" element={<StudentRoute><StudentProfile /></StudentRoute>} />
                <Route path="/profile-settings" element={<StudentRoute><ProfileSettings /></StudentRoute>} />
                <Route path="/inbox"              element={<StudentRoute><Inbox /></StudentRoute>} />

                {/* Admin */}
                <Route path="/admin-home"    element={<AdminRoute><AdminHome /></AdminRoute>} />
                <Route path="/manage-users"  element={<AdminRoute><ManageUsers /></AdminRoute>} />
                <Route path="/manage-skills"    element={<AdminRoute><ManageSkills /></AdminRoute>} />
                <Route path="/manage-projects" element={<AdminRoute><ManageProjects /></AdminRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;