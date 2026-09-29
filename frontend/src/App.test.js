import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/'); });
test('renders the existing login screen', () => {
 render(<App />);
 expect(screen.getByRole('heading', { name: 'Project-Mate' })).toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
});
test('unauthenticated recommendation route returns to login', () => {
 window.history.replaceState({}, '', '/recommended-projects');
 render(<App />);
 expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
});
