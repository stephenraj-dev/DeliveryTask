import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import type { RootState } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-500 via-slate-400 to-slate-500 selection:bg-[#1936A1] selection:text-white">

      <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1936A1] rounded-xl flex items-center justify-center shadow-md">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
          </div>

          <span className="text-xl font-bold text-[#1936A1] tracking-tight">
            Euro Delivery Pro
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <span className="text-sm font-medium text-slate-700">
              {user?.name}
            </span>

            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg uppercase tracking-wider border border-slate-200">
              {user?.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors duration-200"
          >
            Logout
          </button>
        </div>

      </nav>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
        {children}
      </main>

    </div>
  );
};