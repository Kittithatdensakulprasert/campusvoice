import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./context/AuthContext', () => ({
  useAuth: vi.fn()
}));

const { useAuth } = await import('./context/AuthContext');

describe('App routing', () => {
  it('redirects unauthenticated users from /report to /login', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isStaff: false,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/report']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
  });

  it('shows 404 page for unknown route', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isStaff: false,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/not-found']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('404 — ไม่พบหน้าที่ต้องการ')).toBeInTheDocument();
  });
});
