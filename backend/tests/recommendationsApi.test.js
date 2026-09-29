const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const createRouter = require('../routes/recommendations');
process.env.JWT_SECRET = 'local-test-secret-not-for-deployment';
const sign = (payload = { id: 7, role: 'Student' }, options = {}) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h', ...options });
const profile = { id: 7, skills: ['React'], interestsText: 'web', aboutText: '', preferredRole: 'Developer' };
const projects = Array.from({ length: 12 }, (_, i) => ({ projectId: 12-i, projectName: 'web', description: '', leaderId: 99, isApproved: true, status: 'Open', roles: ['Developer'], requiredSkills: ['React'], createdAt: '2026-01-01' }));
async function withApi(overrides, run) {
 const calls=[];
 const repository={getProfile:async id=>{calls.push(['profile',id]);return {...profile};},getCandidates:async id=>{calls.push(['candidates',id]);return projects;},saveProfile:async(id,data)=>{calls.push(['save',id,data]);return true;},...overrides};
 const app=express();app.use(express.json());app.use('/api/recommendations',createRouter(repository));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const request=async(path='',options={})=>{
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/recommendations${path}`,options);
  return {status:response.status,data:await response.json()};
 };
 try{await run(request,calls);}finally{await new Promise(resolve=>server.close(resolve));}
}
const headers=()=>({Authorization:`Bearer ${sign()}`,'Content-Type':'application/json'});
test('unauthenticated, expired, forged and admin tokens denied before data access',async()=>{
 await withApi({},async(request,calls)=>{
  for(const token of [null,'forged',sign(undefined,{expiresIn:-1}),jwt.sign({id:7,role:'Student'},'wrong-secret')]){
   const result=await request('',{headers:token?{Authorization:`Bearer ${token}`}:{}});assert.equal(result.status,401);
  }
  assert.equal((await request('',{headers:{Authorization:`Bearer ${sign({id:7,role:'Admin'})}`}})).status,403);
  assert.equal(calls.length,0);
 });
});
test('token identity wins over supplied userId; top 10 deterministic and explained',async()=>{
 await withApi({},async(request,calls)=>{
  const result=await request('?userId=999',{headers:headers()});assert.equal(result.status,200);
  assert.deepEqual(calls,[['profile',7],['candidates',7]]);
  assert.deepEqual(result.data.recommendations.map(p=>p.projectId),[1,2,3,4,5,6,7,8,9,10]);
  assert.equal(result.data.recommendations[0].matchPercentage,100);
  assert.deepEqual(result.data.recommendations[0].scores,{skill:1,text:1,role:1});
  assert.equal(JSON.stringify(result.data).includes('aboutText'),false);
 });
});
test('inactive student denied despite signed token',async()=>{
 await withApi({getProfile:async()=>null},async request=>assert.equal((await request('',{headers:headers()})).status,403));
});
test('empty candidates and incomplete profile provide structured responses',async()=>{
 await withApi({getCandidates:async()=>[]},async request=>assert.deepEqual((await request('',{headers:headers()})).data.recommendations,[]));
 await withApi({getProfile:async()=>({id:7})},async(request,calls)=>{
  const r=await request('',{headers:headers()});assert.equal(r.data.profileStatus.insufficient,true);assert.equal(r.data.profileStatus.missingFields.length,3);assert.deepEqual(calls,[]);
 });
});
test('preference validation and save cannot change another student',async()=>{
 await withApi({},async(request,calls)=>{
  const body={interestsText:' web ',aboutText:' database ',preferredRole:' Developer ',userId:999};
  const r=await request('/profile',{method:'PUT',headers:headers(),body:JSON.stringify(body)});assert.equal(r.status,200);
  assert.deepEqual(calls.find(c=>c[0]==='save'),['save',7,{interestsText:'web',aboutText:'database',preferredRole:'Developer'}]);
  for(const bad of [{},{...body,preferredRole:'x'.repeat(151)},{...body,aboutText:null}]) assert.equal((await request('/profile',{method:'PUT',headers:headers(),body:JSON.stringify(bad)})).status,400);
  assert.equal((await request('/profile',{headers:headers()})).data.profile.id,7);
 });
});
test('database errors return safe failure without schema or credentials',async()=>{
 await withApi({getCandidates:async()=>{throw new Error('private DB detail');}},async request=>{
  const r=await request('',{headers:headers()});assert.equal(r.status,503);assert.equal(JSON.stringify(r).includes('private DB detail'),false);
 });
});
test('saving preferences changes the next real API ranking',async()=>{
 let current={...profile,skills:[],interestsText:'',preferredRole:''};
 await withApi({getProfile:async()=>current,saveProfile:async(id,data)=>{current={...current,...data};return true;}},async request=>{
  assert.equal((await request('',{headers:headers()})).data.recommendations.length,0);
  await request('/profile',{method:'PUT',headers:headers(),body:JSON.stringify({interestsText:'web',aboutText:'',preferredRole:'Developer'})});
  const r=await request('',{headers:headers()});assert.equal(r.data.recommendations[0].matchPercentage,40);
 });
});
