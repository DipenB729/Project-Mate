const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');
const { authenticate, requireRole, ownParam, actor } = require('../middleware/auth');

router.use(authenticate, requireRole('Student'));

// --- SEND CONNECT REQUEST ---
router.post('/request', actor('requesterId'), async (req, res) => {
    const { requesterId, receiverId } = req.body;
    if (!Number.isSafeInteger(Number(receiverId)) || Number(receiverId) < 1 || Number(receiverId) === requesterId)
        return res.status(400).json({ message: 'Choose another valid user.' });
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
        res.status(500).json({ message: 'Request failed. Please try again.' });
    }
});

// --- RESPOND TO CONNECT REQUEST (Accept / Reject) ---
router.put('/respond/:connectionId', async (req, res) => {
    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid response status.' });
    try {
        const pool = await sql.connect(dbConfig);

        const updated = await pool.request()
            .input('uid', sql.Int, req.user.id)
            .input('cid',    sql.Int,      req.params.connectionId)
            .input('status', sql.NVarChar, status)
            .query(`UPDATE Connections SET Status = @status OUTPUT INSERTED.RequesterId, INSERTED.ReceiverId WHERE ConnectionId = @cid AND ReceiverId = @uid AND Status = 'Pending'`);
        if (!updated.recordset.length) return res.status(409).json({ message: 'Request unavailable.' });
        const { RequesterId: requesterId, ReceiverId: receiverId } = updated.recordset[0];

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
        res.status(500).json({ message: 'Request failed. Please try again.' });
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
        res.status(500).json({ message: 'Request failed. Please try again.' });
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
        res.status(500).json({ message: 'Request failed. Please try again.' });
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
        res.status(500).json({ message: 'Request failed. Please try again.' });
    }
});

// --- DIRECT CONNECT (creates Accepted connection immediately, for project leads) ---
router.post('/direct-connect', actor('requesterId'), async (req, res) => {
    const { requesterId, receiverId } = req.body;
    if (!Number.isSafeInteger(Number(receiverId)) || Number(receiverId) < 1 || Number(receiverId) === requesterId)
        return res.status(400).json({ message: 'Choose another valid user.' });
    try {
        const pool = await sql.connect(dbConfig);

        const permitted = await pool.request().input('lid', sql.Int, req.user.id).input('aid', sql.Int, receiverId)
            .query(`SELECT TOP 1 i.InterestId FROM Interests i JOIN Projects p ON p.ProjectId = i.ProjectId
                WHERE p.LeaderId = @lid AND i.ApplicantId = @aid AND i.Status IN ('Pending', 'Accepted')`);
        if (!permitted.recordset.length) return res.status(403).json({ message: 'Only your project applicants can be connected directly.' });
        // Check if connection already exists
        const check = await pool.request()
            .input('rid', sql.Int, requesterId)
            .input('rcv', sql.Int, receiverId)
            .query(`
                SELECT ConnectionId, Status FROM Connections
                WHERE (RequesterId = @rid AND ReceiverId = @rcv)
                   OR (RequesterId = @rcv AND ReceiverId = @rid)
            `);

        if (check.recordset.length > 0) {
            const existing = check.recordset[0];
            if (existing.Status === 'Accepted') {
                return res.json({ message: "Already connected! You can message each other." });
            }
            // Update existing pending to accepted
            await pool.request()
                .input('cid', sql.Int, existing.ConnectionId)
                .query(`UPDATE Connections SET Status = 'Accepted' WHERE ConnectionId = @cid`);
            return res.json({ message: "Connection accepted! You can now message each other." });
        }

        // Insert as Accepted directly
        await pool.request()
            .input('rid', sql.Int, requesterId)
            .input('rcv', sql.Int, receiverId)
            .query(`INSERT INTO Connections (RequesterId, ReceiverId, Status) VALUES (@rid, @rcv, 'Accepted')`);

        // Notify both users
        const [req1, req2] = await Promise.all([
            pool.request().input('uid', sql.Int, requesterId).query(`SELECT FullName FROM Users WHERE UserId = @uid`),
            pool.request().input('uid', sql.Int, receiverId).query(`SELECT FullName FROM Users WHERE UserId = @uid`),
        ]);

        const leaderName = req1.recordset[0]?.FullName || 'Project Lead';
        const studentName = req2.recordset[0]?.FullName || 'Student';

        // Notify the student
        await pool.request()
            .input('uid',    sql.Int,      receiverId)
            .input('sender', sql.Int,      requesterId)
            .input('type',   sql.NVarChar, 'ConnectionResponse')
            .input('msg',    sql.NVarChar, `${leaderName} connected with you! You can now message each other in the inbox.`)
            .query(`INSERT INTO Notifications (UserId, SenderId, Type, Message) VALUES (@uid, @sender, @type, @msg)`);

        res.json({ message: `Connected with ${studentName}! You can now message each other.` });
    } catch (err) {
        res.status(500).json({ message: 'Request failed. Please try again.' });
    }
});

router.param('userId', ownParam);

module.exports = router;
