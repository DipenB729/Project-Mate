const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
const path = require('path');
const multer = require('multer');

// 1. Serve the uploads folder statically so React can access images
app.use('/uploads', express.static('uploads'));

// 2. Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    }
});
const upload = multer({ storage: storage });
// TEMPORARILY replace your dbConfig with this to test:
const dbConfig = {
    user: 'sa',
    password: 'diladmin123@#$', // Type your password directly here
    server: 'localhost',         // or '127.0.0.1'
    database: 'ProjectMate',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    port: 1433
};

// Add this line right before sql.connect to see what Node is actually using:
console.log(`Connecting as: ${dbConfig.user} with password: ${dbConfig.password}`);

// Test Connection
sql.connect(dbConfig)
    .then(() => console.log("✅ Connected to SSMS Database"))
    .catch(err => console.error("❌ Database Connection Failed:", err));

app.post('/api/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const pool = await sql.connect(dbConfig);
        
        // Check if user exists
        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (userCheck.recordset.length > 0) return res.status(400).json({ message: "Email already exists" });

        // Insert User (Default RoleId = 2 for Student)
        await pool.request()
            .input('name', sql.NVarChar, fullName)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Users (FullName, Email, Password, RoleId) VALUES (@name, @email, @password, 2)');

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LOGIN ROUTE ---
    
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT u.*, r.RoleName 
                FROM Users u 
                JOIN SystemRoles r ON u.RoleId = r.RoleId 
                WHERE u.Email = @email 
                AND u.IsActive = 1 
                AND u.IsDeleted = 0
            `);

        const user = result.recordset[0];
 
        if (!user) {
            return res.status(401).json({ 
                message: "Your account is suspended or does not exist. Please contact Admin." 
            });
        }

        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.UserId, role: user.RoleName }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { id: user.UserId, name: user.FullName, role: user.RoleName } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- ADMIN: GET ALL USERS ---
// --- ADMIN: GET ALL USERS (Including Suspended) ---
app.get('/api/admin/users', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT UserId, FullName, Email, RoleId, IsActive, IsDeleted, CreatedAt 
            FROM Users 
            -- We remove the IsDeleted filter so Admin sees everyone
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: TOGGLE USER STATUS ---
app.put('/api/admin/users/status', async (req, res) => {
    const { userId, isActive } = req.body; // isActive will be the NEW desired state
    try {
        const pool = await sql.connect(dbConfig);
        
        // If we want to ACTIVATE: IsActive=1, IsDeleted=0
        // If we want to SUSPEND: IsActive=0, IsDeleted=1
        const newIsActive = isActive ? 1 : 0;
        const newIsDeleted = isActive ? 0 : 1;

        await pool.request()
            .input('uid', sql.Int, userId)
            .input('active', sql.Bit, newIsActive)
            .input('deleted', sql.Bit, newIsDeleted)
            .query(`
                UPDATE Users 
                SET IsActive = @active, IsDeleted = @deleted, IsModified = GETDATE() 
                WHERE UserId = @uid
            `);
        
        res.json({ message: "User status updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
 
app.post('/api/admin/skills', async (req, res) => {
    const { skillName } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('name', sql.NVarChar, skillName)
            .query('INSERT INTO Skills (SkillName) VALUES (@name)');
        res.json({ message: "New skill added to master list" });
    } catch (err) {
        res.status(500).send("Skill already exists or DB error");
    }
});
// --- GET ALL SKILLS (Used by both Admin and Students) ---
app.get('/api/skills', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Skills ORDER BY SkillName ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: ADD NEW SKILL ---
app.post('/api/admin/skills', async (req, res) => {
    const { skillName } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        
        // Check if skill already exists
        const check = await pool.request()
            .input('name', sql.NVarChar, skillName)
            .query('SELECT * FROM Skills WHERE SkillName = @name');
        
        if (check.recordset.length > 0) {
            return res.status(400).json({ message: "Skill already exists" });
        }

        await pool.request()
            .input('name', sql.NVarChar, skillName)
            .query('INSERT INTO Skills (SkillName) VALUES (@name)');
        
        res.json({ message: "Skill added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: DELETE SKILL ---
app.delete('/api/admin/skills/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Skills WHERE SkillId = @id');
        res.json({ message: "Skill deleted" });
    } catch (err) {
        res.status(500).json({ error: "Cannot delete skill; it might be assigned to students." });
    }
});
// --- GET STUDENT'S CURRENT SKILLS ---
app.get('/api/student/my-skills/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`
                SELECT s.SkillId, s.SkillName 
                FROM UserSkills us
                JOIN Skills s ON us.SkillId = s.SkillId
                WHERE us.UserId = @uid
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- UPDATE STUDENT SKILLS (Add/Remove) ---
app.post('/api/student/update-skills', async (req, res) => {
    const { userId, skillIds } = req.body; // skillIds is an array [1, 5, 12]
    try {
        const pool = await sql.connect(dbConfig);
        
        // Transactional approach: Delete old skills and insert new ones
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        await request.input('uid', sql.Int, userId).query('DELETE FROM UserSkills WHERE UserId = @uid');

        for (const id of skillIds) {
            const insRequest = new sql.Request(transaction);
            await insRequest.input('uid', sql.Int, userId)
                .input('sid', sql.Int, id)
                .query('INSERT INTO UserSkills (UserId, SkillId) VALUES (@uid, @sid)');
        }

        await transaction.commit();
        res.json({ message: "Profile skills updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.put('/api/user/update-profile', upload.single('profilePic'), async (req, res) => {
    try {
        const { userId, fullName, address, existingPic } = req.body;
        
        console.log("Update Request Body:", req.body); // Check if data is coming through
        console.log("Uploaded File:", req.file);       // Check if file is seen by Multer

        if (!userId) {
            return res.status(400).json({ error: "User ID is missing" });
        }

        let profilePicPath = existingPic; 
        if (req.file) {
            profilePicPath = `/uploads/${req.file.filename}`;
        }

        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('uid', sql.Int, userId)
            .input('name', sql.NVarChar, fullName)
            .input('address', sql.NVarChar, address || null)
            .input('pic', sql.NVarChar, profilePicPath || null)
            .query(`
                UPDATE Users 
                SET FullName = @name, Address = @address, ProfilePic = @pic, IsModified = GETDATE() 
                WHERE UserId = @uid
            `);

        res.json({ 
            message: "Profile updated successfully", 
            profilePic: profilePicPath,
            fullName: fullName 
        });
    } catch (err) {
        console.error("DETAILED SQL ERROR:", err); // This prints the real error to your terminal
        res.status(500).json({ error: err.message });
    }
});

// 4. GET USER DETAILS ROUTE
app.get('/api/user/details/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query('SELECT FullName, Email, Address, ProfilePic FROM Users WHERE UserId = @uid');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));