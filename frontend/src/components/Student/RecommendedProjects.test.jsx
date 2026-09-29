import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecommendedProjects from './RecommendedProjects';
import RecommendationPreferences from './RecommendationPreferences';
import BrowseProjects from './BrowseProjects';
import { recommendationRequest } from '../../api/recommendations';
jest.mock('../../api/recommendations');
jest.mock('../Navbar', () => () => <nav>Navigation</nav>);
const project={projectId:4,projectName:'Web Project',description:'Build a web app',matchPercentage:80,matchedSkills:['React'],missingSkills:['SQL Server'],roleMatched:true,matchedRole:'Developer',scores:{skill:1,text:0,role:1}};
const wrap=component=>render(<MemoryRouter>{component}</MemoryRouter>);
beforeEach(()=>{jest.clearAllMocks();localStorage.setItem('user',JSON.stringify({id:7,role:'Student'}));});
test('loading then explained results linking to existing application flow',async()=>{
 recommendationRequest.mockResolvedValue({recommendations:[project],profileStatus:{incomplete:false}});
 wrap(<RecommendedProjects/>);
 expect(screen.getByRole('status')).toHaveTextContent('Finding');
 expect(await screen.findByText('80% Match')).toBeInTheDocument();
 expect(screen.getByText(/SQL Server/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'View project and apply'})).toHaveAttribute('href','/browse-projects?projectId=4');
});
test('error allows retry; incomplete profile and empty states remain actionable',async()=>{
 recommendationRequest.mockRejectedValueOnce(new Error('Session expired')).mockResolvedValueOnce({recommendations:[],profileStatus:{incomplete:true,insufficient:true,missingFields:['skills']}});
 wrap(<RecommendedProjects/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Session expired');
 fireEvent.click(screen.getByRole('button',{name:'Retry'}));
 expect(await screen.findByText('Add skills, interests or a preferred role to get started.')).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Update technical profile'})).toHaveAttribute('href','/student-profile');
});
test('no eligible projects and maximum ten cards',async()=>{
 recommendationRequest.mockResolvedValueOnce({recommendations:[],profileStatus:{incomplete:false}});
 const first=wrap(<RecommendedProjects/>);
 expect(await screen.findByText(/No available projects/)).toBeInTheDocument();first.unmount();
 recommendationRequest.mockResolvedValueOnce({recommendations:Array.from({length:12},(_,i)=>({...project,projectId:i})),profileStatus:{}});
 wrap(<RecommendedProjects/>);await screen.findAllByRole('article');expect(screen.getAllByRole('article')).toHaveLength(10);
});
test('profile preferences load and save only editable fields',async()=>{
 recommendationRequest.mockResolvedValueOnce({profile:{id:7,skills:['React'],interestsText:'web',aboutText:'',preferredRole:'Developer'}}).mockResolvedValueOnce({});
 wrap(<RecommendationPreferences/>);
 const input=await screen.findByLabelText('Academic interests');
 await waitFor(()=>expect(input).toHaveValue('web'));
 fireEvent.change(input,{target:{value:'database'}});
 fireEvent.click(screen.getByRole('button',{name:'Save preferences'}));
 expect(await screen.findByText(/Preferences saved/)).toBeInTheDocument();
 expect(recommendationRequest).toHaveBeenLastCalledWith('/profile',{method:'PUT',body:JSON.stringify({interestsText:'database',aboutText:'',preferredRole:'Developer'})});
});
test('recommendation deep link uses the existing detail modal and interest endpoint',async()=>{
 const detail={ProjectId:4,Title:'Selected project',Description:'Description',LeaderId:99,LeaderName:'Lead',IsApproved:true,Status:'Open',roles:[{RoleId:8,RoleName:'Developer',IsFilled:false}],members:[]};
 global.fetch=jest.fn(url=>Promise.resolve({ok:true,json:async()=>url.endsWith('/projects/4')?detail:url.endsWith('/interests/apply')?{message:'Saved'}:[]}));
 render(<MemoryRouter initialEntries={['/browse-projects?projectId=4']}><BrowseProjects/></MemoryRouter>);
 fireEvent.click(await screen.findByText('Developer'));
 fireEvent.click(screen.getByRole('button',{name:/Send Interest/}));
 await waitFor(()=>expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/interests/apply',expect.objectContaining({method:'POST',body:JSON.stringify({projectId:4,roleId:8,applicantId:7,message:''})})));
});
