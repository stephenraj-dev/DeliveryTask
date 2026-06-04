import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, registerUser, clearAuthError } from '../store/authSlice';
import { Button } from '../components/Button';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'client' | 'rider'>('client');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector(state => state.auth);

  useEffect(() => {
    return () => { dispatch(clearAuthError()); };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = isRegister
      ? dispatch(registerUser({ name, email, password, role }))
      : dispatch(loginUser({ email, password }));
    const result = await action;
    if (result.meta.requestStatus === 'fulfilled') {
      const data = result.payload as { user: { role: string } };
      const redirectMap: Record<string, string> = { admin: '/dashboard', client: '/orders', rider: '/my-deliveries' };
      navigate(redirectMap[data.user.role] || '/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DeliverX</h1>
          <p className="text-gray-500 mt-1">Mini Logistics Platform</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{isRegister ? 'Create Account' : 'Sign In'}</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
          {isRegister && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white" value={role} onChange={e => setRole(e.target.value as 'admin' | 'client' | 'rider')}>
                  <option value="client">Client</option>
                  <option value="rider">Rider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {!isRegister && (
            <div className="mb-6 flex justify-between gap-2">
              <button type="button" onClick={() => { setEmail('admin@test.com'); setPassword('password'); }} className="flex-1 py-2 px-2 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-50 transition">Auto Admin</button>
              <button type="button" onClick={() => { setEmail('client@test.com'); setPassword('password'); }} className="flex-1 py-2 px-2 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-50 transition">Auto Client</button>
              <button type="button" onClick={() => { setEmail('rider@test.com'); setPassword('password'); }} className="flex-1 py-2 px-2 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-50 transition">Auto Rider</button>
            </div>
          )}
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">{isRegister ? 'Create Account' : 'Sign In'}</Button>
          <p className="text-center text-sm text-gray-500 mt-4">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsRegister(!isRegister); dispatch(clearAuthError()); }} className="text-indigo-600 font-medium hover:text-indigo-700">
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};