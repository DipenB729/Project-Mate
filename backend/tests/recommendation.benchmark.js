const { performance } = require('node:perf_hooks');
const { rankProjects } = require('../services/recommendationScoring');
const student={id:1,skills:['React','Node','SQL Server'],interestsText:'web development database applications',preferredRole:'Developer'};
for(const size of [100,1000,5000]) {
 const projects=Array.from({length:size},(_,i)=>({projectId:i+1,leaderId:2,isApproved:true,status:'Open',projectName:`Academic project ${i}`,description:'web development database applications academic team collaboration research design software engineering '.repeat(8),roles:['Developer'],requiredSkills:['React','SQL Server'],createdAt:'2026-01-01'}));
 rankProjects(student,projects);
 const durations=[];
 for(let i=0;i<10;i++){const start=performance.now();rankProjects(student,projects);durations.push(performance.now()-start);}
 durations.sort((a,b)=>a-b);
 console.log(JSON.stringify({candidates:size,runs:10,medianMs:+durations[5].toFixed(2),maxMs:+durations[9].toFixed(2),scope:'in-memory scoring only; excludes SQL and HTTP'}));
}
