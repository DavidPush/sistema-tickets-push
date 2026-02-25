import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isRecovering, setIsRecovering] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoadingAuth(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth Event:', event);
            setSession(session);
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovering(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const requestPasswordReset = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}`
        });
        if (error) throw error;
    };

    const updatePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setIsRecovering(false); // Clear after success
    };

    const clearRecoveryState = () => setIsRecovering(false);

    return (
        <AuthCtx.Provider value={{ session, loadingAuth, logout, requestPasswordReset, updatePassword, isRecovering, clearRecoveryState }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
