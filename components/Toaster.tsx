
import React, { useEffect, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}

interface ToasterProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const Toaster: React.FC<ToasterProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    info: '🔵',
    success: '✅',
    warning: '⚠️'
  };

  return (
    <div className="pointer-events-auto animate-in slide-in-from-right fade-in duration-300">
      <div className="glass px-6 py-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 min-w-[300px]">
        <span className="text-lg">{icons[toast.type]}</span>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-0.5">System Alert</p>
          <p className="text-xs font-bold text-white leading-relaxed">{toast.message}</p>
        </div>
        <button onClick={() => onRemove(toast.id)} className="text-zinc-600 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};
