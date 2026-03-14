const express = require('express');
const router = express.Router();
const { sql, dbConfig } = require('../config/db');

// --- CREATE PROJECT (Student as Lead) ---
router.post('/create', async (req, res) => {
    const { title, description, leaderId, roles } = req.body;
    // roles = [{ roleName, requiredSkillId }, ...]
    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Insert project
        const projResult = await new sql.Request(transaction)
            .input('title', sql.NVarChar, title)
            .input('desc', sql.NVarChar, description)
            .input('leaderId', sql.Int, leaderId)
            .query(`
                INSERT INTO Projects (Title, Description, LeaderId, Status, IsApproved)
                OUTPUT INSERTED.ProjectId
                VALUES (@title, @desc, @leaderId, 'Open', 0)
            `);

        const projectId = projResult.recordset[0].ProjectId;

        // Insert roles
        for (const role of roles) {
            await new sql.Request(transaction)
                .input('projectId', sql.Int, projectId)
                .input('roleName', sql.NVarChar, role.roleName)
                .input('skillId', sql.Int, role.requiredSkillId || null)
                .query(`
                    INSERT INTO ProjectRoles (ProjectId, RoleName, RequiredSkillId, IsFilled)
                    VALUES (@projectId, @roleName, @skillId, 0)
                `);
        }

        // Add leader as first team member
        await new sql.Request(transaction)
            .input('projectId', sql.Int, projectId)
            .input('leaderId', sql.Int, leaderId)
            .query(`
                INSERT INTO TeamMembers (ProjectId, UserId, RoleName)
                VALUES (@projectId, @leaderId, 'Project Lead')
            `);

        await transaction.commit();
        res.status(201).json({ message: "Project created successfully! Awaiting admin approval.", projectId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BROWSE ALL APPROVED PROJECTS (with roles) ---
router.get('/browse', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const projects = await pool.request().query(`
            SELECT 
                p.ProjectId, p.Title, p.Description, p.Status, p.CreatedAt,
                u.FullName AS LeaderName, u.ProfilePic AS LeaderPic
            FROM Projects p
            JOIN Users u ON p.LeaderId = u.UserId
            WHERE p.IsApproved = 1 AND p.Status = 'Open'
            ORDER BY p.CreatedAt DESC
        `);

        const roles = await pool.request().query(`
            SELECT pr.RoleId, pr.ProjectId, pr.RoleName, pr.IsFilled, s.SkillName
            FROM ProjectRoles pr
            LEFT JOIN Skills s ON pr.RequiredSkillId = s.SkillId
        `);

        // Attach roles to each project
        const result = projects.recordset.map(proj => ({
            ...proj,
            roles: roles.recordset.filter(r => r.ProjectId === proj.ProjectId)
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET SINGLE PROJECT DETAILS ---
router.get('/:projectId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const project = await pool.request()
            .input('pid', sql.Int, req.params.projectId)
            .query(`
                SELECT p.*, u.FullName AS LeaderName, u.ProfilePic AS LeaderPic, u.Email AS LeaderEmail
                FROM Projects p
                JOIN Users u ON p.LeaderId = u.UserId
                WHERE p.ProjectId = @pid
            `);

        const roles = await pool.request()
            .input('pid', sql.Int, req.params.projectId)
            .query(`
                SELECT pr.RoleId, pr.RoleName, pr.IsFilled, s.SkillName
                FROM ProjectRoles pr
                LEFT JOIN Skills s ON pr.RequiredSkillId = s.SkillId
                WHERE pr.ProjectId = @pid
            `);

        const members = await pool.request()
            .input('pid', sql.Int, req.params.projectId)
            .query(`
                SELECT tm.RoleName, u.FullName, u.ProfilePic, u.UserId
                FROM TeamMembers tm
                JOIN Users u ON tm.UserId = u.UserId
                WHERE tm.ProjectId = @pid
            `);

        res.json({
            ...project.recordset[0],
            roles: roles.recordset,
            members: members.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET MY PROJECTS (as Lead) ---
router.get('/my-projects/:leaderId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('lid', sql.Int, req.params.leaderId)
            .query(`
                SELECT p.ProjectId, p.Title, p.Description, p.Status, p.IsApproved, p.CreatedAt,
                       COUNT(tm.TeamMemberId) AS MemberCount
                FROM Projects p
                LEFT JOIN TeamMembers tm ON p.ProjectId = tm.ProjectId
                WHERE p.LeaderId = @lid
                GROUP BY p.ProjectId, p.Title, p.Description, p.Status, p.IsApproved, p.CreatedAt
                ORDER BY p.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: GET ALL PROJECTS (pending + approved) ---
router.get('/admin/all', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT p.*, u.FullName AS LeaderName
            FROM Projects p
            JOIN Users u ON p.LeaderId = u.UserId
            ORDER BY p.CreatedAt DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: APPROVE PROJECT ---
router.put('/admin/approve/:projectId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('pid', sql.Int, req.params.projectId)
            .query(`UPDATE Projects SET IsApproved = 1 WHERE ProjectId = @pid`);
        res.json({ message: "Project approved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: REJECT / REVOKE PROJECT ---
router.put('/admin/reject/:projectId', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('pid', sql.Int, req.params.projectId)
            .query(`UPDATE Projects SET IsApproved = 0, Status = 'Closed' WHERE ProjectId = @pid`);
        res.json({ message: "Project rejected" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: GET STATS ---
router.get('/admin/stats', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM Projects)                        AS totalProjects,
                (SELECT COUNT(*) FROM Projects WHERE IsApproved = 0)   AS pendingProjects,
                (SELECT COUNT(*) FROM Projects WHERE IsApproved = 1)   AS approvedProjects,
                (SELECT COUNT(*) FROM Users WHERE RoleId = 2 AND IsDeleted = 0) AS activeStudents,
                (SELECT COUNT(*) FROM Interests WHERE Status = 'Pending') AS pendingInterests
        `);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;