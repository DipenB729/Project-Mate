import React from 'react';
import Navbar from '../Navbar';
import '../../styles/Home.css';

const StudentHome = () => {
    return (
        <div>
            <Navbar /> { }
            <main className="content-area">
                <h1>Welcome to Project-Mate</h1>
               <div className="grid-container">
                    <div className="card"><h3>My Skills</h3><p>React, SQL</p></div>
                    <div className="card"><h3>Matches</h3><p>3 Projects found</p></div>
                </div>
            </main>
        </div>
    );
};

export default StudentHome;