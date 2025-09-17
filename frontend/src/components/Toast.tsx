import React, { createContext, useContext, useState, useCallback } from 'react';

type Toast = { id: number; message: string; type?: string; duration?: number; persistent?: boolean };
type ToastContextType = { push: (message: string, opts?: Partial<Toast>) => number; remove: (id: number) => void };

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, opts: Partial<Toast> = {}) => {
    const id = Date.now() + Math.random();
    const toast: Toast = { id, message, ...opts } as Toast;
    setToasts((t) => [toast, ...t]);
    if (!opts.persistent) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, opts.duration || 4000);
    }
    return id;
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-sm w-full px-4 py-2 rounded shadow ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            <div className="flex justify-between items-start">
              <div className="text-sm">{t.message}</div>
              <button onClick={() => remove(t.id)} className="ml-2 font-bold">×</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
