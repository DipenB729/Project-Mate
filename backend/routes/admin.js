const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');

// --- GET ALL USERS ---
router.get('/users', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT UserId, FullName, Email, RoleId, IsActive, IsDeleted, CreatedAt 
            FROM Users
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TOGGLE USER STATUS (Activate / Suspend) ---
router.put('/users/status', async (req, res) => {
    const { userId, isActive } = req.body;
    try {
        const pool = await sql.connect(dbConfig);

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

// --- ADD NEW SKILL ---
router.post('/skills', async (req, res) => {
    const { skillName } = req.body;
    try {
        const pool = await sql.connect(dbConfig);

        const check = await pool.request()
            .input('name', sql.NVarChar, skillName)
            .query('SELECT * FROM Skills WHERE SkillName = @name');

        if (check.recordset.length > 0)
            return res.status(400).json({ message: "Skill already exists" });

        await pool.request()
            .input('name', sql.NVarChar, skillName)
            .query('INSERT INTO Skills (SkillName) VALUES (@name)');

        res.json({ message: "Skill added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DELETE SKILL ---
router.delete('/skills/:id', async (req, res) => {
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

module.exports = router;