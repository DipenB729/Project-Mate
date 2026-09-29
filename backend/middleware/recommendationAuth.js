const jwt = require('jsonwebtoken');

module.exports = function recommendationAuth(req, res, next) {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
    if (!match) return res.status(401).json({ message: 'Please log in to view recommendations.' });
    if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Authentication is not configured.' });
    try {
        const payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (!Number.isSafeInteger(payload.id) || payload.id < 1) throw new Error('Invalid identity');
        if (payload.role !== 'Student') return res.status(403).json({ message: 'Recommendations are available to students.' });
        req.studentId = payload.id;
        next();
    } catch {
        return res.status(401).json({ message: 'Your session is invalid or expired. Please log in again.' });
    }
};
