import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import type { RootState } from '../store';
import { Modal } from './Modal';
import { Button } from './Button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const confirmLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 selection:bg-blue-600 selection:text-white">

      <nav className="sticky top-0 z-40 w-full bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-6 py-3 flex items-center justify-between shadow-sm">

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
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

          <span className="text-xl font-bold text-white tracking-tight">
            Euro Delivery Pro
          </span>
        </div>

        <div className="flex items-center gap-4">

          {user?.role === "rider" && (
            <div className="hidden lg:block text-right mr-4">
              <p className="text-lg font-semibold text-white">
                Welcome back, {user?.name} 🛵
              </p>
              <p className="text-xs text-gray-400">
                Pick up orders, deliver efficiently, and keep your ratings high.
              </p>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-3 mr-2">
            {user?.role !== "rider" && (
              <span className="text-sm font-medium text-gray-300">
              {user?.name}
            </span>
            )}

            <span className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-semibold rounded-lg uppercase tracking-wider border border-gray-700">
              {user?.role}
            </span>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            Logout
          </button>

        </div>

      </nav>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
        {children}
      </main>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmLogout}>Logout</Button>
          </>
        }
      >
        <p className="text-gray-300">Are you sure you want to log out?</p>
      </Modal>

    </div>
  );
};