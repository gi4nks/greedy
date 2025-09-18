import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastAction = { label: string; onClick: () => void };
type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info'; duration?: number; persistent?: boolean; actions?: ToastAction[] };
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
        {toasts.map((t) => {
          const bg = t.type === 'error' ? 'bg-red-600' : t.type === 'info' ? 'bg-blue-600' : 'bg-green-600';
          return (
            <div key={t.id} className={`max-w-sm w-full px-4 py-2 rounded shadow ${bg} text-white`}>
              <div className="flex justify-between items-start">
                <div className="text-sm">{t.message}</div>
                <button onClick={() => remove(t.id)} className="ml-2 font-bold">×</button>
              </div>
              {t.actions && t.actions.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {t.actions.map((a, idx) => (
                    <button key={idx} onClick={() => { a.onClick(); remove(t.id); }} className="bg-white text-black px-3 py-1 rounded text-sm">
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
