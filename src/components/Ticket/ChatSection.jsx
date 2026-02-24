import React, { useMemo } from 'react';
import { Avatar } from '../UI/Avatar';
import { timeAgo } from '../../utils/helpers';
import { IC } from '../../assets/icons';

export function ChatSection({ messages, users, session, chatEndRef, newMsg, setNewMsg, onPostMsg }) {
    // Optimization: Build a user map once for fast lookup
    const userMap = useMemo(() => {
        const map = {};
        users.forEach(u => { map[u.id] = u; });
        return map;
    }, [users]);

    return (
        <>
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="flex-center flex-col gap-3 py-10 opacity-50">
                        <div className="stat-icon" style={{ background: '#f5f5f5' }}>{IC.msg}</div>
                        <p style={{ fontSize: 13 }}>No hay mensajes aún. ¡Inicia la conversación!</p>
                    </div>
                ) : (
                    messages.map(m => {
                        const isMe = m.user_id === session?.user?.id;
                        const sender = userMap[m.user_id];
                        const isPro = sender?.role === 'admin' || sender?.role === 'technician';

                        return (
                            <div key={m.id} className={`chat-bubble ${isMe ? 'chat-bubble-right' : 'chat-bubble-left'}`}>
                                <Avatar name={sender?.name} size="sm" />
                                <div className="chat-content">
                                    <div className="chat-meta">
                                        <span className="chat-meta-name">{isMe ? 'Tú' : sender?.name}</span>
                                        <span className="chat-meta-time">{timeAgo(m.created_at)}</span>
                                    </div>
                                    <div className={`chat-text ${isMe ? 'chat-text-right' : (isPro ? 'chat-text-pro' : 'chat-text-left')}`}>
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={onPostMsg}>
                <input
                    className="form-input"
                    placeholder="Escribe un mensaje..."
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                />
                <button className="btn btn-purple">{IC.send}</button>
            </form>
        </>
    );
}
