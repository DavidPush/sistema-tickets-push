import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { SUPABASE_URL, SUPABASE_KEY } from '../utils/constants';

const DataCtx = createContext(null);

export function DataProvider({ children }) {
    const { session } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [cats, setCats] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);

    const sendNotification = async (payload) => {
        try {
            console.log('📨 Enviando notificación a Teams:', payload.subject);

            // Intento 1: Supabase SDK
            const { data, error } = await supabase.functions.invoke('notify-email', {
                body: payload
            });

            if (error) {
                console.warn('⚠️ Falló invoke(), probando fetch directo...', error);

                // Intento 2: Fetch directo (bypass library logic)
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                const directResponse = await fetch(`${SUPABASE_URL}/functions/v1/notify-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${currentSession?.access_token || SUPABASE_KEY}`
                    },
                    body: JSON.stringify(payload)
                });

                if (directResponse.ok) {
                    const result = await directResponse.json();
                    console.log('✅ Éxito con fetch directo (Teams):', result);
                    return result;
                } else {
                    const errorText = await directResponse.text().catch(() => 'No body');
                    console.error('❌ Falló fetch directo con status:', directResponse.status, errorText);
                    return null;
                }
            }

            console.log('✅ Éxito con invoke() (Teams)', data);
            return data;
        } catch (e) {
            console.error('❌ Error crítico en sendNotification:', e);
            return null;
        }
    };

    const fetchData = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [tRes, uRes, cRes, fRes] = await Promise.all([
                supabase.from('tickets').select('*').order('created_at', { ascending: false }),
                supabase.from('profiles').select('*'),
                supabase.from('categories').select('*'),
                supabase.from('faqs').select('*').order('created_at', { ascending: false })
            ]);
            setTickets(tRes.data || []);
            setUsers(uRes.data || []);
            setCats(cRes.data || []);
            setFaqs(fRes.data || []);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchData();

        const sub = supabase.channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
                console.log('Realtime Ticket Change:', payload.eventType, payload.new?.id);
                if (payload.eventType === 'INSERT') {
                    setTickets(prev => {
                        if (prev.find(t => t.id === payload.new.id)) return prev;
                        return [payload.new, ...prev];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setTickets(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old?.id;
                    if (deletedId) {
                        setTickets(prev => prev.filter(t => t.id !== deletedId));
                    }
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
                console.log('Realtime Profile Change:', payload.eventType, payload.new?.id);
                if (payload.eventType === 'INSERT') {
                    setUsers(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'UPDATE') {
                    setUsers(prev => prev.map(u => u.id === payload.new.id ? payload.new : u));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                console.log('Realtime Category Change - Fetching All');
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'faqs' }, () => {
                console.log('Realtime FAQ Change - Fetching All');
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attachments' }, () => {
                console.log('Realtime Attachment Change - Fetching All');
                fetchData();
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') console.log('✅ Realtime: Subscribed to all tables');
                if (status === 'CHANNEL_ERROR') console.error('❌ Realtime Error:', err);
                if (status === 'TIMED_OUT') console.warn('⚠️ Realtime Timeout');
            });

        return () => sub.unsubscribe();
    }, [fetchData]);

    // Actions with Optimistic UI updates
    const addTicket = async (t) => {
        const { data, error } = await supabase.from('tickets').insert([t]).select();
        if (error) throw error;
        // The real-time subscription will handle the UI update, 
        // but returning the data is needed for navigation.

        // Notify Admins about new ticket
        console.log('🔍 addTicket: Buscando admins para notificar...', users.length, 'usuarios cargados');
        try {
            const admins = users.filter(u => u.role === 'admin');
            const adminEmails = admins.map(a => a.email).filter(Boolean);
            console.log('🔍 Admins encontrados:', adminEmails);
            if (adminEmails.length > 0) {
                await sendNotification({
                    to: adminEmails,
                    subject: `🎫 Nuevo Ticket creado: ${data[0].title}`,
                    ticketId: data[0].id,
                    priority: data[0].priority,
                    creator: `${session.user.user_metadata?.full_name || session.user.email.split('@')[0]} (${session.user.email})`,
                    title: data[0].title,
                    content: `Se ha creado un nuevo ticket con prioridad **${data[0].priority}**.`,
                    ticketUrl: `${window.location.origin}`
                });
            }
        } catch (e) { console.error('Email notify error:', e); }

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

                // Email notification to user if resolved
                if (upd.status === 'Resuelto') {
                    const user = users.find(u => u.id === oldTicket.creator_id);
                    if (user?.email) {
                        await sendNotification({
                            to: user.email,
                            subject: `✅ Ticket Resuelto: ${oldTicket.title}`,
                            ticketId: id,
                            priority: oldTicket.priority,
                            creator: user.name + ` (${user.email})`,
                            title: oldTicket.title,
                            content: `El ticket ha sido marcado como **Resuelto** por el equipo técnico.`,
                            ticketUrl: `${window.location.origin}`
                        });
                    }
                }
            }
            if (upd.assigned_to && upd.assigned_to !== oldTicket.assigned_to) {
                console.log('🔍 updateTicket: Detectada nueva asignación para ticket', id);
                await supabase.from('notifications').insert([{
                    user_id: oldTicket.creator_id,
                    title: 'Ticket asignado',
                    content: `Tu ticket "${oldTicket.title}" ha sido asignado para su atención.`,
                    type: 'info',
                    ticket_id: id
                }]);

                // Email notification for assignment
                const tech = users.find(u => u.id === upd.assigned_to);
                const user = users.find(u => u.id === oldTicket.creator_id);
                console.log('🔍 Datos para email:', { tech: tech?.name, user: user?.email });
                if (user?.email && tech) {
                    await sendNotification({
                        to: user.email,
                        subject: `👨‍💻 Ticket Asignado`,
                        ticketId: id,
                        priority: oldTicket.priority,
                        creator: user.name + ` (${user.email})`,
                        title: oldTicket.title,
                        content: `El técnico **${tech.name}** ha sido asignado a tu ticket y comenzará a trabajar en él pronto.`,
                        ticketUrl: `${window.location.origin}`
                    });
                }
            }
        } catch (e) {
            console.error('Non-blocking notif error:', e);
        }
    };

    const addMsg = async (m) => {
        const { error } = await supabase.from('messages').insert([m]);
        if (error) throw error;

        // Trigger notification for the other party (only if not private)
        try {
            if (!m.is_private) {
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

                        const targetUser = users.find(u => u.id === targetUid);
                        const senderUser = users.find(u => u.id === m.user_id);
                        if (targetUser?.email) {
                            await sendNotification({
                                to: targetUser.email,
                                subject: `💬 Nueva respuesta en ticket`,
                                ticketId: m.ticket_id,
                                priority: ticket.priority,
                                creator: `${senderUser?.name} (${senderUser?.email})`,
                                title: ticket.title,
                                content: `**Mensaje:**\n"${m.content}"`,
                                ticketUrl: `${window.location.origin}`
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Non-blocking notif error:', e);
        }
    };

    const deleteTicket = async (id) => {
        const { error } = await supabase.from('tickets').delete().eq('id', id);
        if (error) throw error;
        setTickets(prev => prev.filter(t => t.id !== id));
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

    const addFaq = async (f) => {
        const { error } = await supabase.from('faqs').insert([f]);
        if (error) throw error;
        fetchData();
    };

    const updateFaq = async (id, upd) => {
        const { error } = await supabase.from('faqs').update(upd).eq('id', id);
        if (error) throw error;
        fetchData();
    };

    const deleteFaq = async (id) => {
        const { error } = await supabase.from('faqs').delete().eq('id', id);
        if (error) throw error;
        fetchData();
    };

    const uploadFile = async (file) => {
        try {
            // Verify session before starting
            if (!session) throw new Error("Sesión no válida. Por favor, inicia sesión de nuevo.");

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${session.user.id}/${fileName}`;

            console.log("Subiendo archivo:", filePath);

            const { error: uploadError } = await supabase.storage
                .from('tickets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Error en upload:", uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('tickets')
                .getPublicUrl(filePath);

            const publicUrl = data.publicUrl;
            console.log("URL generada:", publicUrl);

            // Verificación extra: Si por alguna razón falta /public/, lo corregimos
            let finalUrl = publicUrl;
            if (!finalUrl.includes('/public/')) {
                finalUrl = finalUrl.replace('/object/tickets/', '/object/public/tickets/');
            }

            return { url: finalUrl, name: file.name, type: file.type, size: file.size };
        } catch (e) {
            console.error("Error completo en uploadFile:", e);
            throw e;
        }
    };

    const addAttachment = async (attr) => {
        const { data, error } = await supabase.from('attachments').insert([attr]).select();
        if (error) throw error;
        return data[0];
    };

    const value = {
        tickets, users, cats, faqs, loading,
        addTicket, updateTicket, addMsg, addHistory,
        updateUser, deleteUser, addCat, updateCat, deleteCat,
        addFaq, updateFaq, deleteFaq,
        deleteTicket,
        uploadFile, addAttachment,
        refresh: fetchData
    };

    return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export const useData = () => useContext(DataCtx);
