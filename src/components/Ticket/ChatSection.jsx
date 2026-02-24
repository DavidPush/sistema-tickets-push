import React, { useMemo } from 'react';
import { Avatar } from '../UI/Avatar';
import { timeAgo } from '../../utils/helpers';
import { IC } from '../../assets/icons';

export function ChatSection({ messages, users, session, chatEndRef, newMsg, setNewMsg, onPostMsg, isPrivate, setIsPrivate, isPro, file, setFile, uploading, fileInputRef }) {
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
                        const isProSender = sender?.role === 'admin' || sender?.role === 'technician';

                        return (
                            <div key={m.id} className={`chat-bubble ${isMe ? 'chat-bubble-right' : 'chat-bubble-left'} ${m.is_private ? 'chat-bubble-private' : ''}`}>
                                <Avatar name={sender?.name} size="sm" />
                                <div className="chat-content">
                                    <div className="chat-meta">
                                        <span className="chat-meta-name">
                                            {isMe ? 'Tú' : sender?.name}
                                            {m.is_private && <span className="private-tag">{IC.lock} Nota Privada</span>}
                                        </span>
                                        <span className="chat-meta-time">{timeAgo(m.created_at)}</span>
                                    </div>
                                    <div className={`chat-text ${isMe ? 'chat-text-right' : (isProSender ? 'chat-text-pro' : 'chat-text-left')} ${m.is_private ? 'chat-text-private' : ''}`}>
                                        {m.content}
                                        {m.attachments && m.attachments.length > 0 && (
                                            <div className="chat-attachments mt-3">
                                                {m.attachments.map(a => (
                                                    <a key={a.id || a.file_url} href={a.file_url} target="_blank" rel="noreferrer" className="attachment-item">
                                                        {a.file_type?.startsWith('image/') || a.file_name?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                            <img src={a.file_url} alt={a.file_name} className="attachment-img" />
                                                        ) : (
                                                            <div className="attachment-file">
                                                                {IC.clip}
                                                                <span>{a.file_name}</span>
                                                            </div>
                                                        )}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>
            {isPro && (
                <div className="chat-privacy-toggle">
                    <label className="flex-center gap-2 cursor-pointer" style={{ fontSize: 12, color: isPrivate ? 'var(--yellow-dark)' : '#999' }}>
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={e => setIsPrivate(e.target.checked)}
                        />
                        {IC.lock} Nota Privada (Solo Interno)
                    </label>
                </div>
            )}
            {file && (
                <div className="chat-file-preview fade-in">
                    <div className="flex-between align-center p-3" style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div className="flex-center gap-3">
                            <div className="stat-icon" style={{ background: 'var(--purple-50)', color: 'var(--purple)', marginBottom: 0, width: 32, height: 32 }}>{IC.clip}</div>
                            <div className="truncate" style={{ maxWidth: 200 }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{file.name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                        </div>
                        <button className="btn-icon text-error" onClick={() => setFile(null)}>{IC.x}</button>
                    </div>
                </div>
            )}
            <form className="chat-input-area" onSubmit={onPostMsg}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={e => setFile(e.target.files[0])}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {IC.clip}
                </button>
                <input
                    className="form-input"
                    placeholder={uploading ? "Subiendo archivo..." : (isPrivate ? "Contenido privado para técnicos..." : "Escribe un mensaje...")}
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    style={isPrivate ? { borderColor: 'var(--yellow)', background: 'var(--yellow-50)' } : {}}
                    disabled={uploading}
                />
                <button className={`btn ${isPrivate ? 'btn-yellow' : 'btn-purple'}`} disabled={uploading || (!newMsg.trim() && !file)}>
                    {uploading ? <div className="spinner-sm" /> : IC.send}
                </button>
            </form>
        </>
    );
}
