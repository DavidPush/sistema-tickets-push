import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { IC } from '../assets/icons';
import { StatusBadge, PriorityBadge } from '../components/UI/Badges';
import { Avatar } from '../components/UI/Avatar';
import { fmtDate, timeAgo } from '../utils/helpers';
import { supabase } from '../services/supabase';
import { ChatSection } from '../components/Ticket/ChatSection';
import { HistorySection } from '../components/Ticket/HistorySection';

export function TicketDetail({ id, onNavigate }) {
    const { session } = useAuth();
    const { tickets, users, cats, updateTicket, addMsg, addHistory } = useData();
    const toast = useToast();

    const [messages, setMessages] = useState([]);
    const [history, setHistory] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [tab, setTab] = useState('chat');
    const chatEnd = useRef(null);

    const t = tickets.find(x => x.id === id);
    const creator = users.find(u => u.id === t?.creator_id);
    const assigned = users.find(u => u.id === t?.assigned_to);
    const cat = cats.find(c => c.id === t?.category_id);
    const profile = users.find(u => u.id === session?.user?.id);
    const canManage = profile?.role === 'admin' || profile?.role === 'technician';
    const isOwner = t?.creator_id === session?.user?.id;
    const canSee = canManage || isOwner;

    if (!t) return <div className="p-8 text-center color-999">Cargando ticket...</div>;
    if (!canSee) return <div className="p-8 text-center color-999">No tienes permiso para ver este ticket.</div>;

    useEffect(() => {
        if (!id) return;
        const fetchAux = async () => {
            const [mRes, hRes] = await Promise.all([
                supabase.from('messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
                supabase.from('history').select('*').eq('ticket_id', id).order('created_at', { ascending: false })
            ]);
            setMessages(mRes.data || []);
            setHistory(hRes.data || []);
        };
        fetchAux();

        // Use a generic channel name or combined per ticket
        const sub = supabase.channel(`ticket_realtime_${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, payload => {
                // Client-side filtering is often more reliable than server-side filters
                if (payload.new.ticket_id === id) {
                    setMessages(prev => {
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'history'
            }, payload => {
                if (payload.new.ticket_id === id) {
                    setHistory(prev => [payload.new, ...prev]);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime subscribed for ticket:', id);
                }
            });

        return () => supabase.removeChannel(sub);
    }, [id]);

    useEffect(() => {
        chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const postMsg = async e => {
        e.preventDefault();
        if (!newMsg.trim()) return;

        const tempId = Date.now();
        const msgObj = {
            id: tempId,
            ticket_id: id,
            user_id: session.user.id,
            content: newMsg,
            created_at: new Date().toISOString(),
            isOptimistic: true
        };

        // Optimistic update
        setMessages(prev => [...prev, msgObj]);
        setNewMsg('');

        try {
            const { data, error } = await supabase.from('messages').insert([{
                ticket_id: id,
                user_id: session.user.id,
                content: msgObj.content
            }]).select();

            if (error) throw error;

            // Replace temporary message with real one
            setMessages(prev => prev.map(m => m.id === tempId ? data[0] : m));
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast(e.message, 'error');
        }
    };

    const update = async (upd, action, silent = false) => {
        try {
            await updateTicket(id, upd);
            if (action) await addHistory({ ticket_id: id, user_id: session.user.id, action });
            if (!silent) toast('Ticket actualizado');
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    if (!t) return <div className="text-center p-20">Ticket no encontrado</div>;

    return (
        <div className="fade-in">
            <button className="back-btn" onClick={() => onNavigate('tickets')}>
                {IC.arrowLeft} Volver a la lista
            </button>

            <div className="flex-between mb-6">
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t.title}</h2>
                    <div className="flex-center gap-2 mt-2">
                        <span style={{ color: '#999', fontSize: 14 }}>#{t.id}</span>
                        <div className="sidebar-divider" style={{ height: 12, width: 1, margin: '0 8px' }} />
                        <span style={{ fontSize: 14 }}>{cat?.icon} {cat?.name}</span>
                    </div>
                </div>
                <div className="flex-center gap-2">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                </div>
            </div>

            <div className="detail-grid">
                <div className="card">
                    <div className="tabs">
                        <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
                            {IC.msg} Chat <span className="tab-badge">{messages.length}</span>
                        </button>
                        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
                            {IC.clock} Historial <span className="tab-badge">{history.length}</span>
                        </button>
                    </div>

                    <div className="modal-body" style={{ height: 500, display: 'flex', flexDirection: 'column' }}>
                        {tab === 'chat' ? (
                            <ChatSection
                                messages={messages}
                                users={users}
                                session={session}
                                chatEndRef={chatEnd}
                                newMsg={newMsg}
                                setNewMsg={setNewMsg}
                                onPostMsg={postMsg}
                            />
                        ) : (
                            <HistorySection
                                history={history}
                                users={users}
                            />
                        )}
                    </div>
                </div>

                <div>
                    <div className="detail-sidebar-section">
                        <h4>Asignación</h4>
                        <div className="detail-info">
                            <div className="detail-info-label">Creado por</div>
                            <div className="detail-info-row">
                                <Avatar name={creator?.name} size="sm" />
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{creator?.name}</span>
                            </div>
                        </div>
                        <div className="detail-info">
                            <div className="detail-info-label">Asignado a</div>
                            {assigned ? (
                                <div className="detail-info-row">
                                    <Avatar name={assigned?.name} size="sm" />
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{assigned?.name}</span>
                                </div>
                            ) : (
                                <div style={{ fontSize: 13, color: '#999', fontStyle: 'italic' }}>Sin asignar</div>
                            )}
                        </div>
                    </div>

                    <div className="detail-sidebar-section">
                        <h4>Acciones</h4>
                        {canManage ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="form-label">Cambiar Estado</label>
                                    <select
                                        className="form-input form-select"
                                        value={t.status}
                                        onChange={e => update({ status: e.target.value }, `Cambió el estado a ${STATUSES[e.target.value].label}`)}
                                    >
                                        <option value="open">Abierto</option>
                                        <option value="in_progress">En Progreso</option>
                                        <option value="waiting">Esperando</option>
                                        <option value="closed">Cerrado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Cambiar Prioridad</label>
                                    <select
                                        className="form-input form-select"
                                        value={t.priority}
                                        onChange={e => update({ priority: e.target.value }, `Cambió la prioridad a ${PRIORITIES[e.target.value].label}`)}
                                    >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                        <option value="critical">Crítica</option>
                                    </select>
                                </div>
                                {!t.assigned_to && (
                                    <button className="btn btn-primary w-full" onClick={() => update({ assigned_to: session.user.id }, 'Tomó el ticket')}>
                                        Tomar Ticket
                                    </button>
                                )}
                                {t.status !== 'closed' && (
                                    <button
                                        className="btn btn-purple w-full"
                                        style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                        onClick={() => update({ status: 'closed' }, 'Resolvió el ticket')}
                                    >
                                        Resolver Ticket
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, color: '#999' }}>No tienes permisos para realizar acciones en este ticket.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
