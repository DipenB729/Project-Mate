const { sql, dbConfig } = require('../config/db');

function createRepository(connect = () => sql.connect(dbConfig)) {
async function getProfile(userId) {
    const pool = await connect();
    const result = await pool.request().input('uid', sql.Int, userId).query(`
        SELECT u.UserId, u.InterestsText, u.AboutText, u.PreferredRole
        FROM Users u JOIN SystemRoles r ON r.RoleId = u.RoleId
        WHERE u.UserId = @uid AND u.IsActive = 1 AND u.IsDeleted = 0 AND r.RoleName = 'Student';
        SELECT s.SkillName FROM UserSkills us JOIN Skills s ON s.SkillId = us.SkillId
        WHERE us.UserId = @uid ORDER BY s.SkillId;
    `);
    const user = result.recordsets[0][0];
    if (!user) return null;
    return { id: user.UserId, interestsText: user.InterestsText || '', aboutText: user.AboutText || '',
        preferredRole: user.PreferredRole || '', skills: result.recordsets[1].map(s => s.SkillName) };
}

async function getCandidates(userId) {
    const pool = await connect();
    const result = await pool.request().input('uid', sql.Int, userId).query(`
        DECLARE @eligible TABLE (ProjectId INT PRIMARY KEY);
        INSERT INTO @eligible (ProjectId)
        SELECT p.ProjectId FROM Projects p
        WHERE p.IsApproved = 1 AND p.Status = 'Open' AND p.LeaderId <> @uid
          AND EXISTS (SELECT 1 FROM ProjectRoles r WHERE r.ProjectId = p.ProjectId AND r.IsFilled = 0)
          AND NOT EXISTS (SELECT 1 FROM TeamMembers tm WHERE tm.ProjectId = p.ProjectId AND tm.UserId = @uid)
          AND NOT EXISTS (SELECT 1 FROM Interests i WHERE i.ProjectId = p.ProjectId AND i.ApplicantId = @uid);
        SELECT p.ProjectId, p.Title, p.Description, p.LeaderId, p.CreatedAt
        FROM Projects p JOIN @eligible e ON e.ProjectId = p.ProjectId;
        SELECT r.ProjectId, r.RoleName, r.IsFilled, s.SkillName
        FROM ProjectRoles r JOIN @eligible e ON e.ProjectId = r.ProjectId
        LEFT JOIN Skills s ON s.SkillId = r.RequiredSkillId ORDER BY r.RoleId;
    `);
    const requirements = new Map();
    for (const row of result.recordsets[1]) {
        if (!requirements.has(row.ProjectId)) requirements.set(row.ProjectId, { requiredSkills: [], roles: [] });
        const group = requirements.get(row.ProjectId);
        if (row.SkillName) group.requiredSkills.push(row.SkillName);
        if (!row.IsFilled) group.roles.push(row.RoleName);
    }
    return result.recordsets[0].map(p => ({ projectId: p.ProjectId, projectName: p.Title,
        description: p.Description || '', leaderId: p.LeaderId, createdAt: p.CreatedAt,
        isApproved: true, status: 'Open', ...requirements.get(p.ProjectId) }));
}

async function saveProfile(userId, profile) {
    const pool = await connect();
    const result = await pool.request().input('uid', sql.Int, userId)
        .input('interests', sql.NVarChar(2000), profile.interestsText)
        .input('about', sql.NVarChar(2000), profile.aboutText)
        .input('role', sql.NVarChar(150), profile.preferredRole)
        .query(`UPDATE u SET InterestsText = @interests, AboutText = @about, PreferredRole = @role
            FROM Users u JOIN SystemRoles r ON r.RoleId = u.RoleId
            WHERE u.UserId = @uid AND u.IsActive = 1 AND u.IsDeleted = 0 AND r.RoleName = 'Student'`);
    return result.rowsAffected[0] === 1;
}

return { getProfile, getCandidates, saveProfile };
}
module.exports = { ...createRepository(), createRepository };
