import axios from 'axios';
export const API = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const SERVER = API.replace(/\/api$/, '');
const client = axios.create();
client.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
export default client;
export function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    return fetch(url, { ...options, headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
}
export async function readList(response) {
    if (!response.ok) throw new Error('Unable to load data. Please try again.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Unexpected server response.');
    return data;
}
