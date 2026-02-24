import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const DataCtx = createContext(null);

export function DataProvider({ children }) {
    const { session } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [cats, setCats] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [tRes, uRes, cRes] = await Promise.all([
                supabase.from('tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('profiles').select('*'),
                supabase.from('categories').select('*')
            ]);
            setTickets(tRes.data || []);
            setUsers(uRes.data || []);
            setCats(cRes.data || []);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchData();

        const sub = supabase.channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
                if (payload.eventType === 'INSERT') {
                    setTickets(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setTickets(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
                } else if (payload.eventType === 'DELETE') {
                    setTickets(prev => prev.filter(t => t.id !== payload.old.id));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
                if (payload.eventType === 'INSERT') {
                    setUsers(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData)
            .subscribe();

        return () => sub.unsubscribe();
    }, [fetchData]);

    // Actions with Optimistic UI updates
    const addTicket = async (t) => {
        const { data, error } = await supabase.from('tickets').insert([t]).select();
        if (error) throw error;
        // The real-time subscription will handle the UI update, 
        // but returning the data is needed for navigation.
        return data[0];
    };

    const updateTicket = async (id, upd) => {
        const oldTicket = tickets.find(t => t.id === id);
        // Optimistic update
        setTickets(prev => prev.map(t => t.id === id ? { ...t, ...upd } : t));
        const { error } = await supabase.from('tickets').update(upd).eq('id', id);
        if (error) {
            fetchData(); // Rollback on error
            throw error;
        }

        // Trigger notification if status changed or assigned
        try {
            if (upd.status && upd.status !== oldTicket.status) {
                await supabase.from('notifications').insert([{
                    user_id: oldTicket.creator_id,
                    title: 'Estado de ticket actualizado',
                    content: `Tu ticket "${oldTicket.title}" ahora está en estado: ${upd.status}`,
                    type: 'success',
                    ticket_id: id
                }]);
            }
            if (upd.assigned_to && upd.assigned_to !== oldTicket.assigned_to) {
                await supabase.from('notifications').insert([{
                    user_id: oldTicket.creator_id,
                    title: 'Ticket asignado',
                    content: `Tu ticket "${oldTicket.title}" ha sido asignado para su atención.`,
                    type: 'info',
                    ticket_id: id
                }]);
            }
        } catch (e) {
            console.error('Non-blocking notif error:', e);
        }
    };

    const addMsg = async (m) => {
        const { error } = await supabase.from('messages').insert([m]);
        if (error) throw error;

        // Trigger notification for the other party
        try {
            const ticket = tickets.find(t => t.id === m.ticket_id);
            if (ticket) {
                const targetUid = m.user_id === ticket.creator_id ? ticket.assigned_to : ticket.creator_id;
                if (targetUid && targetUid !== m.user_id) {
                    await supabase.from('notifications').insert([{
                        user_id: targetUid,
                        title: 'Nuevo mensaje',
                        content: `Tienes un nuevo mensaje en el ticket: ${ticket.title}`,
                        type: 'info',
                        ticket_id: m.ticket_id
                    }]);
                }
            }
        } catch (e) {
            console.error('Non-blocking notif error:', e);
        }
    };

    const addHistory = async (h) => {
        const { error } = await supabase.from('history').insert([h]);
        if (error) throw error;
    };

    const updateUser = async (id, upd) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...upd } : u));
        const { error } = await supabase.from('profiles').update(upd).eq('id', id);
        if (error) {
            fetchData();
            throw error;
        }
    };

    const deleteUser = async (id) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
            fetchData();
            throw error;
        }
    };

    const addCat = async (c) => {
        const { error } = await supabase.from('categories').insert([c]);
        if (error) throw error;
        fetchData();
    };

    const updateCat = async (id, upd) => {
        const { error } = await supabase.from('categories').update(upd).eq('id', id);
        if (error) throw error;
        fetchData();
    };

    const deleteCat = async (id) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        fetchData();
    };

    const value = {
        tickets, users, cats, loading,
        addTicket, updateTicket, addMsg, addHistory,
        updateUser, deleteUser, addCat, updateCat, deleteCat,
        refresh: fetchData
    };

    return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export const useData = () => useContext(DataCtx);
