const { test }=require('node:test');
const assert=require('node:assert/strict');
const {createRepository}=require('../services/recommendationRepository');
test('batched SQL maps all skill requirements and only unfilled roles',async()=>{
 const queries=[],inputs=[];
 const responses=[{recordsets:[[{UserId:7,InterestsText:null,AboutText:null,PreferredRole:null}],[{SkillName:'React'}]]},
 {recordsets:[[{ProjectId:4,Title:'Web',Description:'App',LeaderId:9,CreatedAt:'2026-01-01'}],[{ProjectId:4,RoleName:'Developer',IsFilled:false,SkillName:'React'},{ProjectId:4,RoleName:'Database',IsFilled:true,SkillName:'SQL Server'}]]}];
 const pool={request:()=>({input(...args){inputs.push(args);return this;},async query(sql){queries.push(sql);return responses.shift();}})};
 const repo=createRepository(async()=>pool);
 const profile=await repo.getProfile(7),projects=await repo.getCandidates(7);
 assert.deepEqual(profile,{id:7,interestsText:'',aboutText:'',preferredRole:'',skills:['React']});
 assert.deepEqual(projects[0].roles,['Developer']);assert.deepEqual(projects[0].requiredSkills,['React','SQL Server']);
 assert.equal(queries.length,2);assert.ok(inputs.every(([key,type,value])=>key==='uid'&&value===7));
 assert.match(queries[1],/NOT EXISTS.*TeamMembers/);assert.match(queries[1],/NOT EXISTS.*Interests/);
});
