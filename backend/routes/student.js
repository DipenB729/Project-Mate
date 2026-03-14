const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');

// --- GET STUDENT'S CURRENT SKILLS ---
router.get('/my-skills/:userId', async (req, res) => {
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
router.post('/update-skills', async (req, res) => {
    const { userId, skillIds } = req.body;
    try {
        const pool = await sql.connect(dbConfig);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        await request.input('uid', sql.Int, userId)
            .query('DELETE FROM UserSkills WHERE UserId = @uid');

        for (const id of skillIds) {
            const insRequest = new sql.Request(transaction);
            await insRequest
                .input('uid', sql.Int, userId)
                .input('sid', sql.Int, id)
                .query('INSERT INTO UserSkills (UserId, SkillId) VALUES (@uid, @sid)');
        }

        await transaction.commit();
        res.json({ message: "Profile skills updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;