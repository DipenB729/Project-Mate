const { test } = require('node:test');
const assert = require('node:assert/strict');
const { WEIGHTS, skillMatch, roleMatch, tokenize, tfidf, cosine, rankProjects, profileStatus } = require('../services/recommendationScoring');
const student = { id: 1, skills: ['React.js', 'Node.js', 'Python'], interestsText: 'web development frontend database applications', preferredRole: 'Frontend Developer' };
const project = (projectId, extra = {}) => ({ projectId, projectName: 'Web management', description: 'web-based management application', leaderId: 2, isApproved: true, status: 'Open', roles: ['Frontend Developer'], requiredSkills: ['React.js', 'Node.js', 'SQL Server'], createdAt: '2026-01-01', ...extra });
test('skill denominator, duplicates, normalization, full/partial/no/empty matches', () => {
 const r = skillMatch([' react.js ', 'NODE.js', 'Python', 'Node.js'], ['React.js', 'Node.js', 'SQL Server', ' React.js ']);
 assert.equal(r.skillScore, 2/3); assert.deepEqual(r.missingSkills, ['SQL Server']); assert.equal(r.matchedSkills.length, 2);
 assert.equal(skillMatch(['React'], ['React']).skillScore, 1);
 assert.equal(skillMatch(['React'], ['Python']).skillScore, 0);
 assert.equal(skillMatch([], []).skillScore, 0);
});
test('role normalization, mismatch and missing values', () => {
 assert.equal(roleMatch(' frontend  developer ', ['Frontend Developer']).roleScore, 1);
 for (const args of [['Backend',['Frontend']], ['', ['Frontend']], ['Frontend',[]]]) assert.equal(roleMatch(...args).roleScore, 0);
});
test('shared corpus TF-IDF matches manual IDF and cosine', () => {
 const v = tfidf(['web web app', 'web', 'python']);
 assert.equal(v[0].get('web'), 2/3 * (Math.log(4/3)+1));
 assert.equal(v[1].get('web'), Math.log(4/3)+1);
 assert.equal(v[0].get('app'), 1/3 * (Math.log(4/2)+1));
 const w=v[0].get('web'), a=v[0].get('app');
 assert.ok(Math.abs(cosine(v[0],v[1])-w/Math.sqrt(w*w+a*a))<1e-12);
});
test('text case/punctuation, identical, unrelated and empty vectors', () => {
 assert.deepEqual(tokenize(' WEB,  app! '), ['web','app']);
 const [a,b,c,d]=tfidf(['WEB, app!', 'web app', 'biology research', '']);
 assert.ok(Math.abs(cosine(a,b)-1)<1e-12);
 assert.equal(cosine(a,c),0); assert.equal(cosine(a,d),0); assert.equal(cosine(d,d),0);
});
test('A/B/C fixture ranks correctly and obeys exact 60/20/20 formula', () => {
 const r=rankProjects(student,[project(1),project(2,{projectName:'Biology',description:'genetics',requiredSkills:['R'],roles:['Researcher']}),project(3,{projectName:'Web database',description:'web development',requiredSkills:['Python','SQL Server'],roles:['Analyst']})]);
 assert.deepEqual(r.map(p=>p.projectId),[1,3,2]);
 assert.equal(Object.values(WEIGHTS).reduce((a,b)=>a+b),1);
 assert.equal(r[0].skillScore,2/3); assert.equal(r[0].roleScore,1);
 assert.deepEqual(r[0].missingSkills,['SQL Server']);
 assert.ok(Math.abs(r[0].finalScore-(.6*2/3+.2*r[0].textScore+.2))<1e-12);
 for(const p of r) for(const k of ['skillScore','textScore','roleScore','finalScore']) assert.ok(p[k]>=0&&p[k]<=1);
});
test('eligibility before corpus construction and deduplication', () => {
 const p=project(8);
 const input=[project(1,{leaderId:1}),project(2,{isApproved:false}),project(3,{status:'Closed'}),project(4,{hasApplied:true}),project(5,{hasJoined:true}),project(6,{roles:[]}),p,p];
 assert.deepEqual(rankProjects(student,input),rankProjects(student,[p]));
});
test('top 10 ties use date descending then ID ascending', () => {
 const input=Array.from({length:15},(_,i)=>project(i+1)).reverse();
 assert.deepEqual(rankProjects(student,input).map(p=>p.projectId),Array.from({length:10},(_,i)=>i+1));
 input.push(project(99,{createdAt:'2026-02-01'})); assert.equal(rankProjects(student,input)[0].projectId,99);
});
test('profile updates recalculate each component; empty profiles safe', () => {
 const empty={id:1},p=project(1,{projectName:'web',description:''});
 const score=s=>rankProjects(s,[p])[0].finalScore;
 assert.equal(score(empty),0);
 for(const update of [{skills:['React.js']},{interestsText:'web'},{preferredRole:'Frontend Developer'}]) assert.ok(score({...empty,...update})>0);
 assert.equal(profileStatus(empty).insufficient,true); assert.equal(profileStatus(student).incomplete,false);
});
