import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, ...opts };
    setToasts((t) => [toast, ...t]);
    if (!opts.persistent) {
      setTimeout(() => {
        setToasts((t) => t.filter(x => x.id !== id));
      }, opts.duration || 4000);
    }
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter(x => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end space-y-2">
        {toasts.map(t => (
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

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
