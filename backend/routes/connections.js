const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');

// --- SEND CONNECT REQUEST ---
router.post('/request', async (req, res) => {
    const { requesterId, receiverId } = req.body;
    try {
        const pool = await sql.connect(dbConfig);

        // Check if connection already exists
        const check = await pool.request()
            .input('rid', sql.Int, requesterId)
            .input('rcv', sql.Int, receiverId)
            .query(`
                SELECT * FROM Connections 
                WHERE (RequesterId = @rid AND ReceiverId = @rcv)
                   OR (RequesterId = @rcv AND ReceiverId = @rid)
            `);

        if (check.recordset.length > 0) {
            const existing = check.recordset[0];
            return res.status(400).json({ 
                message: `Connection already ${existing.Status.toLowerCase()}` 
            });
        }

        // Insert connection request
        await pool.request()
            .input('rid', sql.Int, requesterId)
            .input('rcv', sql.Int, receiverId)
            .query(`INSERT INTO Connections (RequesterId, ReceiverId, Status) VALUES (@rid, @rcv, 'Pending')`);

        // Send notification to receiver
        const requester = await pool.request()
            .input('rid', sql.Int, requesterId)
            .query(`SELECT FullName FROM Users WHERE UserId = @rid`);

        const name = requester.recordset[0]?.FullName || 'Someone';

        await pool.request()
            .input('uid',     sql.Int,      receiverId)
            .input('sender',  sql.Int,      requesterId)
            .input('type',    sql.NVarChar, 'ConnectionRequest')
            .input('msg',     sql.NVarChar, `${name} wants to connect with you`)
            .query(`
                INSERT INTO Notifications (UserId, SenderId, Type, Message)
                VALUES (@uid, @sender, @type, @msg)
            `);

        res.json({ message: "Connection request sent!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RESPOND TO CONNECT REQUEST (Accept / Reject) ---
router.put('/respond/:connectionId', async (req, res) => {
    const { status, requesterId, receiverId } = req.body; // status = 'Accepted' | 'Rejected'
    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input('cid',    sql.Int,      req.params.connectionId)
            .input('status', sql.NVarChar, status)
            .query(`UPDATE Connections SET Status = @status WHERE ConnectionId = @cid`);

        // Notify the requester of the response
        const receiver = await pool.request()
            .input('uid', sql.Int, receiverId)
            .query(`SELECT FullName FROM Users WHERE UserId = @uid`);

        const name = receiver.recordset[0]?.FullName || 'Someone';
        const msg  = status === 'Accepted'
            ? `${name} accepted your connection request! You can now message each other.`
            : `${name} declined your connection request.`;

        await pool.request()
            .input('uid',    sql.Int,      requesterId)
            .input('sender', sql.Int,      receiverId)
            .input('type',   sql.NVarChar, 'ConnectionResponse')
            .input('msg',    sql.NVarChar, msg)
            .query(`
                INSERT INTO Notifications (UserId, SenderId, Type, Message)
                VALUES (@uid, @sender, @type, @msg)
            `);

        res.json({ message: `Connection ${status.toLowerCase()}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET CONNECTION STATUS BETWEEN TWO USERS ---
router.get('/status/:userId/:otherUserId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid',   sql.Int, req.params.userId)
            .input('other', sql.Int, req.params.otherUserId)
            .query(`
                SELECT ConnectionId, Status, RequesterId, ReceiverId
                FROM Connections
                WHERE (RequesterId = @uid AND ReceiverId = @other)
                   OR (RequesterId = @other AND ReceiverId = @uid)
            `);
        res.json(result.recordset[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET ALL MY CONNECTIONS (Accepted only) ---
router.get('/my-connections/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`
                SELECT 
                    c.ConnectionId, c.Status, c.CreatedAt,
                    u.UserId AS ConnectedUserId,
                    u.FullName, u.ProfilePic, u.Email
                FROM Connections c
                JOIN Users u ON (
                    CASE WHEN c.RequesterId = @uid THEN c.ReceiverId ELSE c.RequesterId END = u.UserId
                )
                WHERE (c.RequesterId = @uid OR c.ReceiverId = @uid)
                  AND c.Status = 'Accepted'
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET PENDING REQUESTS RECEIVED ---
router.get('/pending/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`
                SELECT 
                    c.ConnectionId, c.CreatedAt,
                    u.UserId AS RequesterId,
                    u.FullName, u.ProfilePic
                FROM Connections c
                JOIN Users u ON c.RequesterId = u.UserId
                WHERE c.ReceiverId = @uid AND c.Status = 'Pending'
                ORDER BY c.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;