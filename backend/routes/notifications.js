const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');

// --- GET ALL NOTIFICATIONS FOR A USER ---
router.get('/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`
                SELECT 
                    n.NotificationId, n.Type, n.Message, n.IsRead,
                    n.RelatedId, n.CreatedAt,
                    u.FullName AS SenderName, u.ProfilePic AS SenderPic
                FROM Notifications n
                JOIN Users u ON n.SenderId = u.UserId
                WHERE n.UserId = @uid
                ORDER BY n.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET UNREAD COUNT (for bell badge) ---
router.get('/unread-count/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`SELECT COUNT(*) AS count FROM Notifications WHERE UserId = @uid AND IsRead = 0`);
        res.json({ count: result.recordset[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MARK ALL AS READ ---
router.put('/mark-read/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`UPDATE Notifications SET IsRead = 1 WHERE UserId = @uid AND IsRead = 0`);
        res.json({ message: "Notifications marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MARK SINGLE NOTIFICATION AS READ ---
router.put('/mark-one/:notifId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('nid', sql.Int, req.params.notifId)
            .query(`UPDATE Notifications SET IsRead = 1 WHERE NotificationId = @nid`);
        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;