import { recommendationRequest } from './recommendations';
beforeEach(()=>{localStorage.clear();global.fetch=jest.fn();});
test('requires login and attaches stored JWT',async()=>{
 await expect(recommendationRequest()).rejects.toThrow('log in');expect(fetch).not.toHaveBeenCalled();
 localStorage.setItem('token','signed-token');fetch.mockResolvedValue({ok:true,json:async()=>({recommendations:[]})});
 await recommendationRequest();expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/recommendations',expect.objectContaining({headers:expect.objectContaining({Authorization:'Bearer signed-token'})}));
});
test('server failure is surfaced to UI',async()=>{
 localStorage.setItem('token','expired');fetch.mockResolvedValue({ok:false,json:async()=>({message:'Session expired'})});
 await expect(recommendationRequest()).rejects.toThrow('Session expired');
});
