const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { sql } = require('../config/db');
process.env.JWT_SECRET = 'test-only-secret';
const originalConnect = sql.connect;
const OriginalTransaction = sql.Transaction;
const OriginalRequest = sql.Request;
async function api(run, query = () => ({ recordset: [] })) {
    const queries = []; const events = [];
    class Request {
        constructor() { this.params = {}; }
        input(name, type, value) { this.params[name] = value; return this; }
        async query(text) {
            queries.push({ text, params: this.params });
            if (text.includes('SELECT u.UserId, r.RoleName')) return { recordset: [{ UserId: this.params.uid, RoleName: this.params.uid === 1 ? 'Admin' : 'Student' }] };
            return query(text, this.params);
        }
    }
    sql.connect = async () => ({ request: () => new Request() });
    sql.Request = Request;
    sql.Transaction = class { async begin() { events.push('begin'); } async commit() { events.push('commit'); } async rollback() { events.push('rollback'); } };
    const app = express(); app.use(express.json());
    for (const route of ['admin','projects','messages','connections','interests','student','notifications']) app.use('/'+route, require('../routes/'+route));
    const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    const request = async (path, { id=2, token=true, body, method='GET' }={}) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = 'Bearer '+jwt.sign({ id, role: 'Admin' },process.env.JWT_SECRET);
        const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers, body: body && JSON.stringify(body) });
        return { status: res.status, data: await res.json() };
    };
    try { await run(request, queries, events); } finally { await new Promise(resolve => server.close(resolve)); sql.connect=originalConnect; sql.Request=OriginalRequest; sql.Transaction=OriginalTransaction; }
}
test('legacy routes reject missing credentials before database access', async()=>api(async (req, queries)=>{
    for (const path of ['/admin/users','/projects/admin/all','/messages/inbox/2','/connections/pending/2','/interests/my-team/2','/student/my-skills/2','/notifications/2']) assert.equal((await req(path,{token:false})).status,401);
    assert.equal(queries.length,0);
}));
test('database role overrides forged role claim; private identities protected', async()=>api(async req=>{
    assert.equal((await req('/admin/users')).status,403);
    assert.equal((await req('/projects/admin/all')).status,403);
    assert.equal((await req('/messages/inbox/99')).status,403);
    assert.equal((await req('/interests/apply',{method:'POST',body:{applicantId:99}})).status,403);
}));
test('unread count scoped to authenticated recipient',async()=>api(async(req,queries)=>{
    assert.deepEqual(await req('/messages/unread-count/2'),{status:200,data:{count:4}});
    assert.equal(queries.at(-1).params.uid,2);
},()=>({recordset:[{count:4}]})));
test('admin reapproval reopens project',async()=>api(async(req,queries)=>{
    assert.equal((await req('/projects/admin/approve/9',{id:1,method:'PUT'})).status,200);
    assert.match(queries.at(-1).text,/IsApproved = 1, Status = 'Open'/);
}));
test('application responses reject invalid status and foreign ownership',async()=>api(async(req,q,events)=>{
    assert.equal((await req('/interests/respond/8',{method:'PUT',body:{status:'garbage'}})).status,400);
    assert.equal((await req('/interests/respond/8',{method:'PUT',body:{status:'Accepted'}})).status,404);
    assert.deepEqual(events,['begin','rollback']);
    assert.match(q.at(-1).text,/p.LeaderId = @uid/);
}));
test('acceptance uses stored IDs, commits atomically, rejects repeated acceptance',async()=>{
    let state='Pending';
    await api(async(req,q,events)=>{
        const options={method:'PUT',body:{status:'Accepted',applicantId:999,projectId:999,roleId:999}};
        assert.equal((await req('/interests/respond/8',options)).status,200);
        const insert=q.find(x=>x.text.includes('INSERT INTO TeamMembers'));
        assert.equal(insert.params.aid,3); assert.equal(insert.params.pid,9); assert.equal(insert.params.rid,4);
        assert.equal((await req('/interests/respond/8',options)).status,409);
        assert.deepEqual(events,['begin','commit','begin','rollback']);
    },text=>{
        if(text.includes('SELECT i.*')) return {recordset:[{InterestId:8,ApplicantId:3,ProjectId:9,RoleId:4,RoleName:'Developer',Status:state,IsFilled:0,IsApproved:1,ProjectStatus:'Open'}]};
        if(text.includes('UPDATE Interests SET Status = @status')) state='Accepted';
        return {recordset:[]};
    });
});
test('failed project insert rolls transaction back',async()=>api(async(req,q,events)=>{
    assert.equal((await req('/projects/create',{method:'POST',body:{title:'Test',description:'Test',roles:[{roleName:'Developer'}]}})).status,500);
    assert.deepEqual(events,['begin','rollback']);
},()=>{throw new Error('simulated failure');}));
test('connection response requires pending receiver; direct connect requires applicant relationship',async()=>api(async(req,q)=>{
    assert.equal((await req('/connections/respond/7',{method:'PUT',body:{status:'Accepted',requesterId:99,receiverId:99}})).status,409);
    assert.match(q.at(-1).text,/ReceiverId = @uid AND Status = 'Pending'/);
    assert.equal((await req('/connections/direct-connect',{method:'POST',body:{receiverId:3}})).status,403);
}));
