const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');
const { authenticate, requireRole, ownParam, actor } = require('../middleware/auth');

router.use(authenticate, requireRole('Student'));

// --- APPLY FOR A ROLE (Express Interest) ---
router.post('/apply', actor('applicantId'), async (req, res) => {
    const { projectId, roleId, applicantId, message } = req.body;
    let transaction;
    try {
        const pool = await sql.connect(dbConfig);
        transaction = new sql.Transaction(pool);
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        const role = await new sql.Request(transaction)
            .input('pid', sql.Int, projectId).input('rid', sql.Int, roleId).input('uid', sql.Int, applicantId)
            .query(`SELECT p.LeaderId, p.Title FROM Projects p WITH (UPDLOCK, HOLDLOCK)
                JOIN ProjectRoles pr WITH (UPDLOCK, HOLDLOCK) ON pr.ProjectId = p.ProjectId
                WHERE p.ProjectId = @pid AND pr.RoleId = @rid AND pr.IsFilled = 0
                AND p.IsApproved = 1 AND p.Status = 'Open' AND p.LeaderId <> @uid
                AND NOT EXISTS (SELECT 1 FROM TeamMembers WHERE ProjectId = @pid AND UserId = @uid)
                AND NOT EXISTS (SELECT 1 FROM Interests WHERE ProjectId = @pid AND RoleId = @rid AND ApplicantId = @uid)`);
        if (!role.recordset.length) {
            await transaction.rollback();
            return res.status(409).json({ message: 'Role unavailable or application already exists.' });
        }
        await new sql.Request(transaction).input('pid', sql.Int, projectId).input('rid', sql.Int, roleId)
            .input('aid', sql.Int, applicantId).input('msg', sql.NVarChar, message || null)
            .query(`INSERT INTO Interests (ProjectId, RoleId, ApplicantId, Message, Status)
                VALUES (@pid, @rid, @aid, @msg, 'Pending')`);
        await new sql.Request(transaction).input('uid', sql.Int, role.recordset[0].LeaderId)
            .input('sender', sql.Int, applicantId)
            .input('msg', sql.NVarChar, `New application for "${role.recordset[0].Title}"`)
            .query(`INSERT INTO Notifications (UserId, SenderId, Type, Message) VALUES (@uid, @sender, 'NewInterest', @msg)`);
        await transaction.commit();
        res.status(201).json({ message: 'Interest submitted successfully!' });
    } catch (err) {
        if (transaction) { try { await transaction.rollback(); } catch {} }
        res.status(500).json({ message: 'Unable to submit application.' });
    }
});

// --- GET MY APPLICATIONS (Student view) ---
router.get('/my-applications/:applicantId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('aid', sql.Int, req.params.applicantId)
            .query(`
                SELECT
                    i.InterestId                AS InterestId,
                    CAST(i.Status AS NVARCHAR)  AS InterestStatus,
                    i.Message                   AS AppMessage,
                    CONVERT(NVARCHAR, i.CreatedAt, 120) AS AppDate,
                    p.Title                     AS ProjectTitle,
                    p.ProjectId                 AS ProjectId,
                    p.IsApproved                AS ProjectIsApproved,
                    pr.RoleName                 AS RoleName,
                    u.FullName                  AS LeaderName
                FROM Interests i
                JOIN Projects p      ON i.ProjectId = p.ProjectId
                JOIN ProjectRoles pr ON i.RoleId    = pr.RoleId
                JOIN Users u         ON p.LeaderId  = u.UserId
                WHERE i.ApplicantId = @aid
                ORDER BY i.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Request failed. Please try again.' });
    }
});

// --- GET INCOMING INTERESTS (Project Lead view) ---
router.get('/incoming/:leaderId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('lid', sql.Int, req.params.leaderId)
            .query(`
                SELECT
                    i.InterestId, i.Status, i.Message, i.CreatedAt,
                    p.Title AS ProjectTitle, p.ProjectId,
                    pr.RoleName, pr.RoleId,
                    u.FullName AS ApplicantName, u.ProfilePic, u.UserId AS ApplicantId
                FROM Interests i
                JOIN Projects p ON i.ProjectId = p.ProjectId
                JOIN ProjectRoles pr ON i.RoleId = pr.RoleId
                JOIN Users u ON i.ApplicantId = u.UserId
                WHERE p.LeaderId = @lid AND i.Status = 'Pending'
                ORDER BY i.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Request failed. Please try again.' });
    }
});

// --- ACCEPT OR REJECT INTEREST (Project Lead) ---
router.put('/respond/:interestId', async (req, res) => {
    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid response status.' });
    let transaction;
    try {
        const pool = await sql.connect(dbConfig);
        transaction = new sql.Transaction(pool);
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        const found = await new sql.Request(transaction).input('iid', sql.Int, req.params.interestId)
            .input('uid', sql.Int, req.user.id).query(`
                SELECT i.*, pr.RoleName, pr.IsFilled, p.IsApproved, p.Status AS ProjectStatus
                FROM Interests i WITH (UPDLOCK, HOLDLOCK)
                JOIN Projects p WITH (UPDLOCK, HOLDLOCK) ON p.ProjectId = i.ProjectId
                JOIN ProjectRoles pr WITH (UPDLOCK, HOLDLOCK) ON pr.RoleId = i.RoleId AND pr.ProjectId = i.ProjectId
                WHERE i.InterestId = @iid AND p.LeaderId = @uid`);
        const interest = found.recordset[0];
        if (!interest) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Application not found.' });
        }
        if (interest.Status !== 'Pending' || (status === 'Accepted' && (interest.IsFilled || !interest.IsApproved || interest.ProjectStatus !== 'Open'))) {
            await transaction.rollback();
            return res.status(409).json({ message: 'Application or role is no longer available.' });
        }
        const request = () => new sql.Request(transaction)
            .input('iid', sql.Int, interest.InterestId).input('pid', sql.Int, interest.ProjectId)
            .input('rid', sql.Int, interest.RoleId).input('aid', sql.Int, interest.ApplicantId)
            .input('lid', sql.Int, req.user.id);
        if (status === 'Accepted') {
            const member = await request().query('SELECT UserId FROM TeamMembers WITH (UPDLOCK, HOLDLOCK) WHERE ProjectId = @pid AND UserId = @aid');
            if (member.recordset.length) {
                await transaction.rollback();
                return res.status(409).json({ message: 'Applicant is already a team member.' });
            }
            await request().input('role', sql.NVarChar, interest.RoleName).query(`
                INSERT INTO TeamMembers (ProjectId, UserId, RoleName) VALUES (@pid, @aid, @role);
                UPDATE ProjectRoles SET IsFilled = 1 WHERE RoleId = @rid AND ProjectId = @pid;
                UPDATE Interests SET Status = 'Rejected' WHERE Status = 'Pending' AND InterestId <> @iid
                    AND (RoleId = @rid OR (ProjectId = @pid AND ApplicantId = @aid));
                IF EXISTS (SELECT 1 FROM Connections WITH (UPDLOCK, HOLDLOCK)
                    WHERE (RequesterId = @lid AND ReceiverId = @aid) OR (RequesterId = @aid AND ReceiverId = @lid))
                    UPDATE Connections SET Status = 'Accepted'
                    WHERE (RequesterId = @lid AND ReceiverId = @aid) OR (RequesterId = @aid AND ReceiverId = @lid);
                ELSE INSERT INTO Connections (RequesterId, ReceiverId, Status) VALUES (@lid, @aid, 'Accepted');`);
        }
        await request().input('status', sql.NVarChar, status).input('msg', sql.NVarChar, `Your project application was ${status.toLowerCase()}.`)
            .query(`UPDATE Interests SET Status = @status WHERE InterestId = @iid;
                INSERT INTO Notifications (UserId, SenderId, Type, Message) VALUES (@aid, @lid, @status, @msg);`);
        await transaction.commit();
        res.json({ message: `Application ${status} successfully` });
    } catch (err) {
        if (transaction) { try { await transaction.rollback(); } catch {} }
        res.status(500).json({ message: 'Unable to respond to application.' });
    }
});

// --- GET MY TEAM (student - projects I joined) ---
router.get('/my-team/:userId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`
                SELECT
                    p.ProjectId, p.Title, p.Description, p.Status,
                    tm.RoleName AS MyRole, tm.JoinedAt,
                    u.FullName AS LeaderName, u.ProfilePic AS LeaderPic
                FROM TeamMembers tm
                JOIN Projects p ON tm.ProjectId = p.ProjectId
                JOIN Users u ON p.LeaderId = u.UserId
                WHERE tm.UserId = @uid
                ORDER BY tm.JoinedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Request failed. Please try again.' });
    }
});

router.param('applicantId', ownParam);
router.param('leaderId', ownParam);
router.param('userId', ownParam);

module.exports = router;
