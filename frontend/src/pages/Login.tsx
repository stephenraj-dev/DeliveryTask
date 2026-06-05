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
      : dispatch(loginUser({ email, password, role }));
    const result = await action;
    if (result.meta.requestStatus === 'fulfilled') {
      const data = result.payload as { user: { role: string } };
      const redirectMap: Record<string, string> = { admin: '/dashboard', client: '/orders', rider: '/my-deliveries' };
      navigate(redirectMap[data.user.role] || '/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background decorations matching the image (very subtle gradient/noise in background) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 15% 15%, #1F2937 0%, transparent 40%), radial-gradient(circle at 85% 85%, #1F2937 0%, transparent 40%)' }}></div>

      {/* Delivery App Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-50 blur-[6px] pointer-events-none z-0"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1617195737496-bc30194e3a19?auto=format&fit=crop&w=2000&q=80")' }}
      ></div>
      {/* Dark overlay to make text readable */}
      <div className="absolute inset-0 w-full h-full bg-gray-900/60 pointer-events-none z-0"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-white">
          Euro Delivery Pro
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Precision Management for Global Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10">
        <div className="bg-gray-800 py-8 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl border border-gray-700">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">{isRegister ? 'Create Account' : 'Welcome back'}</h3>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              {isRegister ? 'Please fill in the details to create your account.' : 'Please enter your credentials to access the dashboard.'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-800 rounded-lg p-3 flex items-start animate-[fadeIn_0.2s_ease-in-out]">
                <div className="flex-shrink-0"><svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></div>
                <div className="ml-2.5"><p className="text-sm font-medium text-red-200">{error}</p></div>
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 tracking-wide">Full Name</label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-white placeholder-gray-500"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 tracking-wide">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-white placeholder-gray-500"
                  placeholder="name@logistics-pro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-300 tracking-wide">
                  Password
                </label>
                {!isRegister && (
                  <a href="#" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-white placeholder-gray-500 font-mono"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center cursor-pointer">
                  <svg className="h-5 w-5 text-gray-500 hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 tracking-wide mb-1.5">
                {isRegister ? 'Register as' : 'Login as'}
              </label>
              <div className="flex rounded-lg border border-gray-700 bg-gray-900/50 p-1">
                {(['admin', 'client', 'rider'] as ('admin'|'client'|'rider')[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 flex justify-center py-1.5 text-sm font-medium rounded-md transition-colors ${
                      role === r
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full py-2.5 text-base rounded-lg" loading={loading}>
                <span className="flex items-center justify-center gap-2">
                  {isRegister ? 'Sign Up' : 'Login'} <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </span>
              </Button>
            </div>
            
            <div className="mt-6 border-t border-gray-700 pt-6">
              <p className="text-center text-sm text-gray-400">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button type="button" onClick={() => setIsRegister(!isRegister)} className="font-bold text-blue-400 hover:text-blue-300">
                  {isRegister ? 'Login' : 'Sign Up'}
                </button>
              </p>
            </div>
          </form>
        </div>

        <div className="mt-8 flex justify-center items-center gap-6 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Secure Login
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            SSL Encrypted
          </div>
        </div>
      </div>
    </div>
  );
};