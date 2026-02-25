import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { IC } from '../assets/icons';
import { StatusBadge, PriorityBadge } from '../components/UI/Badges';
import { STATUSES, PRIORITIES } from '../utils/constants';
import { Avatar } from '../components/UI/Avatar';
import { fmtDate, timeAgo, fmtId } from '../utils/helpers';
import { supabase } from '../services/supabase';
import { ChatSection } from '../components/Ticket/ChatSection';
import { HistorySection } from '../components/Ticket/HistorySection';

export function TicketDetail({ id, onNavigate }) {
    const { session } = useAuth();
    const { tickets, users, cats, updateTicket, addMsg, addHistory, uploadFile, addAttachment, deleteTicket, notifyMessage, loading: loadingData } = useData();
    const toast = useToast();

    const [messages, setMessages] = useState([]);
    const [history, setHistory] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [tab, setTab] = useState('chat');
    const chatEnd = useRef(null);
    const fileInputRef = useRef(null);

    const t = tickets.find(x => Number(x.id) === Number(id));
    const creator = users.find(u => u.id === t?.creator_id);
    const assigned = users.find(u => u.id === t?.assigned_to);
    const cat = cats.find(c => c.id === t?.category_id);
    const profile = users.find(u => u.id === session?.user?.id);
    const canManage = profile?.role === 'admin' || profile?.role === 'technician';
    const isOwner = t?.creator_id === session?.user?.id;
    const canSee = canManage || isOwner;

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este ticket permanentemente?')) return;
        try {
            await deleteTicket(id);
            toast('Ticket eliminado correctamente');
            onNavigate('tickets');
        } catch (e) {
            toast('Error al eliminar: ' + e.message, 'error');
        }
    };

    useEffect(() => {
        // Safeguard: If ticket disappears from global state while on this page, navigate back
        if (!loadingData && id && !t) {
            console.log('Ticket disappearing from state, navigating back...');
            onNavigate('tickets');
        }
    }, [t, loadingData, id, onNavigate]);

    useEffect(() => {
        if (!id || !t) return;
        const fetchAux = async () => {
            const query = supabase.from('messages').select('*').eq('ticket_id', id);

            if (!canManage) {
                query.eq('is_private', false);
            }

            const [mRes, hRes, aRes] = await Promise.all([
                query.order('created_at', { ascending: true }),
                supabase.from('history').select('*').eq('ticket_id', id).order('created_at', { ascending: false }),
                supabase.from('attachments').select('*').eq('ticket_id', id)
            ]);

            // Combine messages with their attachments
            const allAtts = aRes.data || [];
            const msgsWithAttribs = (mRes.data || []).map((m, idx) => ({
                ...m,
                attachments: allAtts.filter(a => a.message_id === m.id || (idx === 0 && !a.message_id))
            }));

            // If there are no messages yet but there are initial attachments, create a "ghost" message object for display
            if (msgsWithAttribs.length === 0 && allAtts.some(a => !a.message_id)) {
                msgsWithAttribs.push({
                    id: 'initial',
                    content: t.description,
                    user_id: t.creator_id,
                    created_at: t.created_at,
                    attachments: allAtts.filter(a => !a.message_id)
                });
            }

            setMessages(msgsWithAttribs);
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
                    if (payload.new.is_private && !canManage) return;
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
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'attachments'
            }, payload => {
                if (payload.new.ticket_id === id) {
                    setMessages(prev => prev.map(m => {
                        if (m.id === payload.new.message_id) {
                            const atts = m.attachments || [];
                            if (atts.find(a => a.id === payload.new.id)) return m;
                            return { ...m, attachments: [...atts, payload.new] };
                        }
                        return m;
                    }));
                }
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'tickets'
            }, payload => {
                if (Number(payload.old?.id) === Number(id)) {
                    toast('Este ticket ha sido eliminado por otro usuario');
                    onNavigate('tickets');
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
        if (e) e.preventDefault();
        if (!newMsg.trim() && !file) return;

        setUploading(true);
        const tempId = Date.now();
        const msgObj = {
            id: tempId,
            ticket_id: id,
            user_id: session.user.id,
            content: newMsg,
            is_private: isPrivate,
            created_at: new Date().toISOString(),
            isOptimistic: true,
            attachments: file ? [{ file_name: file.name, file_url: URL.createObjectURL(file), isTemp: true }] : []
        };

        setMessages(prev => [...prev, msgObj]);
        const currentMsg = newMsg;
        const currentFile = file;
        setNewMsg('');
        setFile(null);

        try {
            const { data: mData, error: mError } = await supabase.from('messages').insert([{
                ticket_id: id,
                user_id: session.user.id,
                content: currentMsg || (currentFile ? `📎 Archivo adjunto: ${currentFile.name}` : ''),
                is_private: isPrivate
            }]).select();

            if (mError) throw mError;
            const realMsg = mData[0];

            let attachmentData = null;
            if (currentFile) {
                const { url, name, type, size } = await uploadFile(currentFile);

                attachmentData = await addAttachment({
                    ticket_id: id,
                    message_id: realMsg.id,
                    file_name: name,
                    file_url: url,
                    file_type: type,
                    file_size: size,
                    created_by: session.user.id
                });
            }

            setIsPrivate(false);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...realMsg, attachments: attachmentData ? [attachmentData] : [] } : m));

            // Notify Teams manually now that attachments are ready
            if (!isPrivate) {
                await notifyMessage(id, currentMsg, attachmentData ? [attachmentData] : [], session.user.id);
            }
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast(e.message, 'error');
        } finally {
            setUploading(false);
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

    if (!t) return (
        <div className="p-12 text-center">
            <h2 className="mb-4">Este ticket ya no está disponible</h2>
            <p className="color-999 mb-6">Puede que haya sido eliminado por el usuario o archivado.</p>
            <button className="btn btn-primary" onClick={() => onNavigate('tickets')}>
                Volver a la lista
            </button>
        </div>
    );

    return (
        <div className="fade-in">
            <button className="back-btn" onClick={() => onNavigate('tickets')}>
                {IC.arrowLeft} Volver a la lista
            </button>

            <div className="flex-between mb-6">
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t.title}</h2>
                    <div className="flex-center gap-2 mt-2">
                        <span style={{ color: 'var(--purple)', fontWeight: 700, fontSize: 14 }}>{fmtId(t.id)}</span>
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
                                isPrivate={isPrivate}
                                setIsPrivate={setIsPrivate}
                                isPro={canManage}
                                file={file}
                                setFile={setFile}
                                uploading={uploading}
                                fileInputRef={fileInputRef}
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
                                {isOwner && t.status === 'open' && (
                                    <button className="btn btn-ghost text-error w-full mt-2" onClick={handleDelete} style={{ gap: 8, justifyContent: 'flex-start' }}>
                                        {IC.trash} Eliminar mi Ticket
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {isOwner && t.status === 'open' && (
                                    <button className="btn btn-ghost text-error w-full mb-4" onClick={handleDelete} style={{ gap: 8, justifyContent: 'flex-start' }}>
                                        {IC.trash} Eliminar mi Ticket
                                    </button>
                                )}
                                <div style={{ fontSize: 13, color: '#999' }}>No tienes permisos para realizar acciones en este ticket.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
