const WEIGHTS = Object.freeze({ skill: 0.60, text: 0.20, role: 0.20 });
const normalize = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
const clamp = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const unique = values => [...new Map((values || []).filter(v => normalize(v))
    .map(v => [normalize(v), String(v).trim()])).values()];

function skillMatch(studentSkills, requiredSkills) {
    const student = new Set((studentSkills || []).map(normalize));
    const required = unique(requiredSkills);
    const matchedSkills = required.filter(s => student.has(normalize(s)));
    const missingSkills = required.filter(s => !student.has(normalize(s)));
    return { skillScore: required.length ? matchedSkills.length / required.length : 0, matchedSkills, missingSkills };
}

function roleMatch(preferredRole, roles) {
    const preferred = normalize(preferredRole);
    const matchedRole = preferred ? unique(roles).find(r => normalize(r) === preferred) || null : null;
    return { roleScore: matchedRole ? 1 : 0, roleMatched: Boolean(matchedRole), matchedRole };
}

// Unicode words, no stemming or stop-word removal. Technical punctuation becomes separators.
function tokenize(text) {
    return normalize(text).match(/[\p{L}\p{N}]+/gu) || [];
}

function tfidf(documents) {
    const counts = documents.map(document => {
        const terms = new Map();
        for (const token of tokenize(document)) terms.set(token, (terms.get(token) || 0) + 1);
        return terms;
    });
    const frequency = new Map();
    for (const terms of counts) for (const term of terms.keys()) frequency.set(term, (frequency.get(term) || 0) + 1);
    // Every sparse vector shares this corpus's vocabulary and smoothed IDF values.
    return counts.map(terms => {
        const length = [...terms.values()].reduce((a, b) => a + b, 0);
        return new Map([...terms].map(([term, count]) => [term,
            count / length * (Math.log((1 + documents.length) / (1 + frequency.get(term))) + 1)]));
    });
}

function cosine(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (const [term, value] of a) { dot += value * (b.get(term) || 0); normA += value * value; }
    for (const value of b.values()) normB += value * value;
    return normA && normB ? clamp(dot / Math.sqrt(normA * normB)) : 0;
}

function rankProjects(student, projects) {
    const seen = new Set();
    const candidates = projects.filter(p => {
        if (!p.isApproved || p.status !== 'Open' || p.leaderId === student.id || p.hasApplied || p.hasJoined ||
            !p.roles?.length || seen.has(p.projectId)) return false;
        seen.add(p.projectId);
        return true;
    });
    const [studentVector, ...vectors] = tfidf([
        `${student.interestsText || ''} ${student.aboutText || ''}`,
        ...candidates.map(p => `${p.projectName || ''} ${p.description || ''}`),
    ]);
    return candidates.map((p, index) => {
        const skill = skillMatch(student.skills, p.requiredSkills);
        const role = roleMatch(student.preferredRole, p.roles);
        const textScore = cosine(studentVector, vectors[index]);
        const finalScore = clamp(WEIGHTS.skill * skill.skillScore + WEIGHTS.text * textScore + WEIGHTS.role * role.roleScore);
        return {
            projectId: p.projectId, projectName: p.projectName, description: p.description,
            ...skill, ...role, textScore, finalScore,
            scores: { skill: skill.skillScore, text: textScore, role: role.roleScore },
            matchPercentage: Math.round(finalScore * 1000) / 10,
            createdAt: p.createdAt,
        };
    }).sort((a, b) => b.finalScore - a.finalScore ||
        (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || a.projectId - b.projectId).slice(0, 10);
}

function profileStatus(profile) {
    const missingFields = [];
    if (!profile.skills?.length) missingFields.push('skills');
    if (!tokenize(`${profile.interestsText || ''} ${profile.aboutText || ''}`).length) missingFields.push('interests or about text');
    if (!normalize(profile.preferredRole)) missingFields.push('preferred role');
    return { missingFields, incomplete: missingFields.length > 0, insufficient: missingFields.length === 3 };
}

module.exports = { WEIGHTS, normalize, clamp, skillMatch, roleMatch, tokenize, tfidf, cosine, rankProjects, profileStatus };
