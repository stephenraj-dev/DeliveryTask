import React, { useEffect, useState, useCallback } from 'react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let addToastFn: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (addToastFn) addToastFn(message, type);
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => { addToastFn = addToast; return () => { addToastFn = null; }; }, [addToast]);

  const colors: Record<string, string> = {
    success: 'bg-emerald-500 text-white shadow-emerald-500/20',
    error: 'bg-rose-500 text-white shadow-rose-500/20',
    info: 'bg-indigo-500 text-white shadow-indigo-500/20',
  };

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex flex-col gap-3">
      {toasts.map(t => (
        <div key={t.id} className={`${colors[t.type]} px-5 py-3.5 rounded-xl shadow-lg font-semibold text-sm tracking-wide flex items-center gap-3 animate-[slideIn_0.3s_cubic-bezier(0.16,1,0.3,1)] min-w-[280px]`}>
          {t.type === 'success' && <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
          {t.type === 'error' && <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>}
          {t.type === 'info' && <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          {t.message}
        </div>
      ))}
    </div>
  );
};
