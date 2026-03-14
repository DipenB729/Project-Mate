const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, dbConfig } = require('../config/db');

// --- REGISTER ---
router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const pool = await sql.connect(dbConfig);

        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (userCheck.recordset.length > 0)
            return res.status(400).json({ message: "Email already exists" });

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

// --- LOGIN ---
router.post('/login', async (req, res) => {
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

        const token = jwt.sign(
            { id: user.UserId, role: user.RoleName },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, user: { id: user.UserId, name: user.FullName, role: user.RoleName } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;