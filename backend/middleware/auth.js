const jwt = require('jsonwebtoken');
const { sql, dbConfig } = require('../config/db');

async function authenticate(req, res, next) {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
    if (!match) return res.status(401).json({ message: 'Please log in.' });
    if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Authentication is not configured.' });
    let payload;
    try {
        payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (!Number.isSafeInteger(payload.id) || payload.id < 1) throw new Error('Invalid identity');
    } catch {
        return res.status(401).json({ message: 'Your session is invalid or expired. Please log in again.' });
    }
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().input('uid', sql.Int, payload.id).query(`
            SELECT u.UserId, r.RoleName FROM Users u
            JOIN SystemRoles r ON r.RoleId = u.RoleId
            WHERE u.UserId = @uid AND u.IsActive = 1 AND u.IsDeleted = 0`);
        if (!result.recordset.length) return res.status(401).json({ message: 'Account is unavailable.' });
        req.user = { id: payload.id, role: result.recordset[0].RoleName };
        next();
    } catch {
        res.status(503).json({ message: 'Account verification is temporarily unavailable.' });
    }
}
function requireRole(role) {
    return (req, res, next) => req.user.role === role ? next() : res.status(403).json({ message: 'Access denied.' });
}
function ownParam(req, res, next, value) {
    if (Number(value) !== req.user.id) return res.status(403).json({ message: 'Access denied.' });
    next();
}
function actor(field) {
    return (req, res, next) => {
        if (req.body?.[field] !== undefined && Number(req.body[field]) !== req.user.id)
            return res.status(403).json({ message: 'Access denied.' });
        req.body = req.body || {};
        req.body[field] = req.user.id;
        next();
    };
}
module.exports = { authenticate, requireRole, ownParam, actor };
