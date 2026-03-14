const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');

// --- SEND A MESSAGE ---
router.post('/send', async (req, res) => {
    const { senderId, receiverId, body } = req.body;

    if (!body || body.trim() === "") return res.status(400).json({ message: "Message body cannot be empty" });
    if (senderId === receiverId) return res.status(400).json({ message: "You cannot message yourself" });

    try {
        const pool = await sql.connect(dbConfig);

        // 1. Verify connection status is 'Accepted'
        const connCheck = await pool.request()
            .input('sid', sql.Int, senderId)
            .input('rid', sql.Int, receiverId)
            .query(`
                SELECT Status FROM Connections
                WHERE ((RequesterId = @sid AND ReceiverId = @rid)
                    OR (RequesterId = @rid AND ReceiverId = @sid))
                  AND Status = 'Accepted'
            `);

        if (connCheck.recordset.length === 0) {
            return res.status(403).json({ message: "You must be connected to send a message." });
        }

        // 2. Insert the message
        const msgResult = await pool.request()
            .input('sid',  sql.Int,      senderId)
            .input('rid',  sql.Int,      receiverId)
            .input('body', sql.NVarChar, body.trim())
            .query(`
                INSERT INTO Messages (SenderId, ReceiverId, Body, IsRead, SentAt)
                OUTPUT INSERTED.*
                VALUES (@sid, @rid, @body, 0, GETDATE())
            `);

        const newMessage = msgResult.recordset[0];

        // 3. Send notification (Async - don't wait for it to finish to respond to user)
        pool.request()
            .input('sid', sql.Int, senderId)
            .query(`SELECT FullName FROM Users WHERE UserId = @sid`)
            .then(result => {
                const name = result.recordset[0]?.FullName || 'Someone';
                return pool.request()
                    .input('uid',    sql.Int,      receiverId)
                    .input('sender', sql.Int,      senderId)
                    .input('type',   sql.NVarChar, 'Message')
                    .input('msg',    sql.NVarChar, `${name} sent you a message`)
                    .query(`INSERT INTO Notifications (UserId, SenderId, Type, Message) VALUES (@uid, @sender, @type, @msg)`);
            }).catch(err => console.error("Notification Error:", err));

        res.json(newMessage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET CONVERSATION ---
router.get('/conversation/:userId/:otherUserId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { userId, otherUserId } = req.params;

        // Mark incoming messages as read
        await pool.request()
            .input('uid',   sql.Int, userId)
            .input('other', sql.Int, otherUserId)
            .query(`UPDATE Messages SET IsRead = 1 WHERE ReceiverId = @uid AND SenderId = @other AND IsRead = 0`);

        const result = await pool.request()
            .input('uid',   sql.Int, userId)
            .input('other', sql.Int, otherUserId)
            .query(`
                SELECT m.*, u.FullName AS SenderName
                FROM Messages m
                JOIN Users u ON m.SenderId = u.UserId
                WHERE (m.SenderId = @uid AND m.ReceiverId = @other)
                   OR (m.SenderId = @other AND m.ReceiverId = @uid)
                ORDER BY m.SentAt ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET INBOX LIST ---
router.get('/inbox/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`
                SELECT 
                    u.UserId AS OtherUserId, u.FullName, u.ProfilePic,
                    latest.Body AS LastMessage, latest.SentAt AS LastMessageAt,
                    (SELECT COUNT(*) FROM Messages WHERE ReceiverId = @uid AND SenderId = u.UserId AND IsRead = 0) AS UnreadCount
                FROM (
                    SELECT *, ROW_NUMBER() OVER (PARTITION BY CASE WHEN SenderId = @uid THEN ReceiverId ELSE SenderId END ORDER BY SentAt DESC) AS rn
                    FROM Messages WHERE SenderId = @uid OR ReceiverId = @uid
                ) latest
                JOIN Users u ON u.UserId = (CASE WHEN latest.SenderId = @uid THEN latest.ReceiverId ELSE latest.SenderId END)
                WHERE latest.rn = 1
                ORDER BY latest.SentAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;