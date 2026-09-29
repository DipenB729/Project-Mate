const express = require('express');
const auth = require('../middleware/recommendationAuth');
const { rankProjects, profileStatus } = require('../services/recommendationScoring');

function createRouter(repository = require('../services/recommendationRepository')) {
    const router = express.Router();
    router.use(auth);
    router.use(async (req, res, next) => {
        try {
            req.profile = await repository.getProfile(req.studentId);
            if (!req.profile) return res.status(403).json({ message: 'An active student account is required.' });
            next();
        } catch (err) { next(err); }
    });
    router.get('/profile', (req, res) => res.json({ profile: req.profile }));
    router.put('/profile', async (req, res, next) => {
        const profile = {};
        for (const [key, max] of Object.entries({ interestsText: 2000, aboutText: 2000, preferredRole: 150 })) {
            const value = req.body?.[key];
            if (typeof value !== 'string' || value.length > max) {
                return res.status(400).json({ message: `${key} must be text of at most ${max} characters.` });
            }
            profile[key] = value.trim();
        }
        try {
            if (!await repository.saveProfile(req.studentId, profile)) return res.status(403).json({ message: 'An active student account is required.' });
            res.json({ message: 'Recommendation preferences saved.', profile });
        } catch (err) { next(err); }
    });
    router.get('/', async (req, res, next) => {
        try {
            const status = profileStatus(req.profile);
            const recommendations = status.insufficient ? [] : rankProjects(req.profile, await repository.getCandidates(req.studentId));
            res.json({ recommendations, profileStatus: status,
                message: status.insufficient ? 'Add skills, interests or a preferred role to get recommendations.' : undefined });
        } catch (err) { next(err); }
    });
    router.use((err, req, res, next) => {
        console.error('Recommendation request failed:', err.code || 'UNKNOWN');
        res.status(503).json({ message: 'Recommendations are temporarily unavailable. Please try again later.' });
    });
    return router;
}
module.exports = createRouter;
