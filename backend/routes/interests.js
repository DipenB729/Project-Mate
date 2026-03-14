const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');

// --- APPLY FOR A ROLE (Express Interest) ---
router.post('/apply', async (req, res) => {
    const { projectId, roleId, applicantId, message } = req.body;
    try {
        const pool = await sql.connect(dbConfig);

        // Prevent duplicate application
        const check = await pool.request()
            .input('pid', sql.Int, projectId)
            .input('rid', sql.Int, roleId)
            .input('aid', sql.Int, applicantId)
            .query(`
                SELECT * FROM Interests 
                WHERE ProjectId = @pid AND RoleId = @rid AND ApplicantId = @aid
            `);

        if (check.recordset.length > 0)
            return res.status(400).json({ message: "You have already applied for this role." });

        // Check role is not already filled
        const roleCheck = await pool.request()
            .input('rid', sql.Int, roleId)
            .query(`SELECT IsFilled FROM ProjectRoles WHERE RoleId = @rid`);

        if (roleCheck.recordset[0]?.IsFilled)
            return res.status(400).json({ message: "This role has already been filled." });

        await pool.request()
            .input('pid', sql.Int, projectId)
            .input('rid', sql.Int, roleId)
            .input('aid', sql.Int, applicantId)
            .input('msg', sql.NVarChar, message || null)
            .query(`
                INSERT INTO Interests (ProjectId, RoleId, ApplicantId, Message, Status)
                VALUES (@pid, @rid, @aid, @msg, 'Pending')
            `);

        // --- Auto-notify the project lead ---
        const projInfo = await pool.request()
            .input('pid', sql.Int, projectId)
            .query(`
                SELECT p.LeaderId, p.Title, u.FullName AS ApplicantName
                FROM Projects p
                JOIN Users u ON u.UserId = ${applicantId}
                WHERE p.ProjectId = @pid
            `);

        if (projInfo.recordset.length > 0) {
            const { LeaderId, Title, ApplicantName } = projInfo.recordset[0];
            await pool.request()
                .input('uid',    sql.Int,      LeaderId)
                .input('sender', sql.Int,      applicantId)
                .input('type',   sql.NVarChar, 'NewInterest')
                .input('notifMsg', sql.NVarChar, `${ApplicantName} is interested in joining your project "${Title}"`)
                .query(`
                    INSERT INTO Notifications (UserId, SenderId, Type, Message)
                    VALUES (@uid, @sender, @type, @notifMsg)
                `);
        }

        res.status(201).json({ message: "Interest submitted successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// --- ACCEPT OR REJECT INTEREST (Project Lead) ---
router.put('/respond/:interestId', async (req, res) => {
    const { status, applicantId, projectId, roleId, roleName } = req.body;
    // status = 'Accepted' or 'Rejected'
    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Update interest status
        await new sql.Request(transaction)
            .input('iid', sql.Int, req.params.interestId)
            .input('status', sql.NVarChar, status)
            .query(`UPDATE Interests SET Status = @status WHERE InterestId = @iid`);

        if (status === 'Accepted') {
            // Add to TeamMembers
            await new sql.Request(transaction)
                .input('pid', sql.Int, projectId)
                .input('uid', sql.Int, applicantId)
                .input('role', sql.NVarChar, roleName)
                .query(`
                    INSERT INTO TeamMembers (ProjectId, UserId, RoleName)
                    VALUES (@pid, @uid, @role)
                `);

            // Mark role as filled
            await new sql.Request(transaction)
                .input('rid', sql.Int, roleId)
                .query(`UPDATE ProjectRoles SET IsFilled = 1 WHERE RoleId = @rid`);

            // Auto-create accepted connection between lead and applicant
            const projLeader = await pool.request()
                .input('pid', sql.Int, projectId)
                .query(`SELECT LeaderId FROM Projects WHERE ProjectId = @pid`);
            const leaderId = projLeader.recordset[0]?.LeaderId;

            if (leaderId) {
                const existingConn = await pool.request()
                    .input('lid', sql.Int, leaderId)
                    .input('aid', sql.Int, applicantId)
                    .query(`
                        SELECT ConnectionId, Status FROM Connections
                        WHERE (RequesterId = @lid AND ReceiverId = @aid)
                           OR (RequesterId = @aid AND ReceiverId = @lid)
                    `);

                if (existingConn.recordset.length === 0) {
                    await new sql.Request(transaction)
                        .input('requester', sql.Int, leaderId)
                        .input('receiver',  sql.Int, applicantId)
                        .query(`INSERT INTO Connections (RequesterId, ReceiverId, Status) VALUES (@requester, @receiver, 'Accepted')`);
                } else if (existingConn.recordset[0].Status !== 'Accepted') {
                    await new sql.Request(transaction)
                        .input('cid', sql.Int, existingConn.recordset[0].ConnectionId)
                        .query(`UPDATE Connections SET Status = 'Accepted' WHERE ConnectionId = @cid`);
                }
            }

            // Reject all other pending interests for the same role
            await new sql.Request(transaction)
                .input('rid', sql.Int, roleId)
                .input('iid', sql.Int, req.params.interestId)
                .query(`
                    UPDATE Interests SET Status = 'Rejected'
                    WHERE RoleId = @rid AND InterestId != @iid AND Status = 'Pending'
                `);
        }

        await transaction.commit();

        // Notify applicant of the decision
        try {
            const notifPool = await sql.connect(dbConfig);

            // Get project title and leader name
            const info = await notifPool.request()
                .input('pid', sql.Int, projectId)
                .query(`
                    SELECT p.Title, u.FullName AS LeaderName, p.LeaderId
                    FROM Projects p
                    JOIN Users u ON p.LeaderId = u.UserId
                    WHERE p.ProjectId = @pid
                `);

            if (info.recordset.length > 0) {
                const { Title, LeaderName, LeaderId } = info.recordset[0];
                const msg = status === 'Accepted'
                    ? `🎉 You were accepted for a role in "${Title}"! You can now message ${LeaderName} in your inbox.`
                    : `Your application for "${Title}" was not accepted this time.`;

                await notifPool.request()
                    .input('uid',    sql.Int,      applicantId)
                    .input('sender', sql.Int,      LeaderId)
                    .input('type',   sql.NVarChar, status)
                    .input('msg',    sql.NVarChar, msg)
                    .query(`
                        INSERT INTO Notifications (UserId, SenderId, Type, Message)
                        VALUES (@uid, @sender, @type, @msg)
                    `);
            }
        } catch (notifErr) {
            console.error("Notification error:", notifErr.message);
        }

        res.json({ message: `Application ${status} successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;