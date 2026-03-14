require('dotenv').config(); // must be FIRST
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { sql, dbConfig } = require('./config/db');

const app = express();
app.use(express.json());
app.use(cors());

// --- Static uploads folder ---
app.use('/uploads', express.static('uploads'));

// --- Multer Storage ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// --- Test DB Connection ---
console.log(`Connecting as: ${dbConfig.user}`);
sql.connect(dbConfig)
    .then(() => console.log("✅ Connected to SSMS Database"))
    .catch(err => console.error("❌ Database Connection Failed:", err));

// --- Routes ---
const authRoutes     = require('./routes/auth');
const adminRoutes    = require('./routes/admin');
const studentRoutes  = require('./routes/student');
const userRoutes     = require('./routes/user')(upload);
const projectRoutes      = require('./routes/projects');
const interestRoutes     = require('./routes/interests');
const notificationRoutes = require('./routes/notifications');
const connectionRoutes   = require('./routes/connections');
const messageRoutes      = require('./routes/messages');

app.use('/api',                authRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/student',        studentRoutes);
app.use('/api/user',           userRoutes);
app.use('/api/projects',       projectRoutes);
app.use('/api/interests',      interestRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/connections',    connectionRoutes);
app.use('/api/messages',       messageRoutes);

// --- GET ALL SKILLS (shared endpoint) ---
app.get('/api/skills', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query('SELECT * FROM Skills ORDER BY SkillName ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));