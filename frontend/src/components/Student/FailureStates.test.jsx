import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BrowseProjects from './BrowseProjects';
import CreateProject from './CreateProject';
import MyProjects from './MyProjects';
jest.mock('../Navbar', () => () => <div>Navigation</div>);
beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({id:2,role:'Student'}));
    localStorage.setItem('token','test-token');
    global.fetch = jest.fn().mockResolvedValue({ok:false,status:500,json:async()=>({error:'DB unavailable'})});
});
afterEach(() => localStorage.clear());
test.each([['Browse',BrowseProjects],['Create',CreateProject],['My Projects',MyProjects]])('%s survives HTTP 500 with visible error',async(_,Component)=>{
    render(<MemoryRouter><Component /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load/);
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
});
