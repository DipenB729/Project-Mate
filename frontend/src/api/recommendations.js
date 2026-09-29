const API = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function recommendationRequest(path = '', options = {}) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Please log in again to use recommendations.');
    const response = await fetch(`${API}/recommendations${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load recommendations. Please try again.');
    return data;
}
