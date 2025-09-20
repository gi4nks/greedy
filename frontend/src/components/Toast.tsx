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
      <div className="toast toast-top toast-end z-50">
        {toasts.map((t) => {
          const alertClass = t.type === 'error' ? 'alert-error' : t.type === 'info' ? 'alert-info' : 'alert-success';
          return (
            <div key={t.id} className={`alert ${alertClass} shadow-lg`}>
              <div>
                <span>{t.message}</span>
              </div>
              <div className="flex gap-2">
                {t.actions && t.actions.length > 0 && (
                  <>
                    {t.actions.map((a, idx) => (
                      <button key={idx} onClick={() => { a.onClick(); remove(t.id); }} className="btn btn-sm btn-ghost">
                        {a.label}
                      </button>
                    ))}
                  </>
                )}
                <button onClick={() => remove(t.id)} className="btn btn-sm btn-circle btn-ghost">✕</button>
              </div>
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
