import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const NotifCtx = createContext(null);

export function NotificationProvider({ children }) {
    const { session } = useAuth();
    const [notifications, setNotifications] = useState([]);

    const fetchNotifs = async () => {
        if (!session) return;
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(20);
        setNotifications(data || []);
    };

    useEffect(() => {
        fetchNotifs();

        const sub = supabase.channel(`notifs-${session?.user?.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${session?.user?.id}`
            }, payload => {
                setNotifications(prev => [payload.new, ...prev]);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${session?.user?.id}`
            }, payload => {
                setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
            })
            .subscribe();

        return () => sub.unsubscribe();
    }, [session]);

    const markAsRead = async (id) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        if (error) console.error(error);
    };

    const markAllAsRead = async () => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', session.user.id)
            .eq('is_read', false);
        if (error) console.error(error);
    };

    const addNotification = async (notif) => {
        const { error } = await supabase.from('notifications').insert([notif]);
        if (error) console.error('Error adding notification:', error);
    };

    return (
        <NotifCtx.Provider value={{ notifications, markAsRead, markAllAsRead, addNotification }}>
            {children}
        </NotifCtx.Provider>
    );
}

export const useNotifications = () => useContext(NotifCtx);
