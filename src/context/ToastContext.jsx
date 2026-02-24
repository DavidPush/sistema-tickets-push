import React, { createContext, useContext, useState } from 'react';
import { IC } from '../assets/icons';
import { genId } from '../utils/helpers';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (msg, type = 'success') => {
        const id = genId();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    };

    return (
        <ToastCtx.Provider value={addToast}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type} slide-up`}>
                        {t.type === 'success' && IC.check}
                        {t.type === 'error' && IC.alert}
                        {t.msg}
                    </div>
                ))}
            </div>
        </ToastCtx.Provider>
    );
}

export const useToast = () => useContext(ToastCtx);
