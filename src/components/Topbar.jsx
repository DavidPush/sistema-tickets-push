import React, { useState, useRef, useEffect } from 'react';
import { IC } from '../assets/icons';
import { Avatar } from './UI/Avatar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../utils/helpers';

export function Topbar({ title, sub, profile, onToggleMobile, onNavigate, onSelectTicket }) {
    const { logout } = useAuth();
    const { notifications, markAsRead, markAllAsRead } = useNotifications();

    const [showProfile, setShowProfile] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);

    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        const h = e => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const handleNotifClick = async (n) => {
        await markAsRead(n.id);
        if (n.ticket_id) {
            onSelectTicket(n.ticket_id);
            onNavigate('detail');
        }
        setShowNotifs(false);
    };

    return (
        <header className="topbar">
            <div className="flex-center gap-3">
                <button className="mobile-menu-btn" onClick={onToggleMobile}>
                    {IC.menu}
                </button>
                <div className="topbar-title">
                    <h1>{title}</h1>
                    <p>{sub}</p>
                </div>
            </div>
            <div className="topbar-actions">
                <div className="dropdown-container" ref={notifRef}>
                    <button className="topbar-bell" onClick={() => setShowNotifs(!showNotifs)}>
                        {IC.bell}
                        {unreadCount > 0 && <span className="topbar-bell-dot" />}
                    </button>

                    {showNotifs && (
                        <div className="dropdown-menu notif-dropdown slide-down">
                            <div className="dropdown-header">
                                <h3>Notificaciones</h3>
                                <button className="btn-link" onClick={markAllAsRead}>Marcar todo como leído</button>
                            </div>
                            <div className="dropdown-body">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty">No hay notificaciones</div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                                            onClick={() => handleNotifClick(n)}
                                        >
                                            <div className="notif-icon">{n.type === 'success' ? '✅' : '🔔'}</div>
                                            <div className="notif-content">
                                                <div className="notif-title">{n.title}</div>
                                                <div className="notif-text">{n.content}</div>
                                                <div className="notif-time">{timeAgo(n.created_at)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="dropdown-container" ref={profileRef}>
                    <div className="topbar-profile" onClick={() => setShowProfile(!showProfile)}>
                        <Avatar name={profile?.name} size="md" />
                        <span className="topbar-profile-name">{profile?.name}</span>
                        {IC.chevDown}
                    </div>

                    {showProfile && (
                        <div className="dropdown-menu profile-dropdown slide-down">
                            <div className="dropdown-user">
                                <Avatar name={profile?.name} size="lg" />
                                <div className="dropdown-user-info">
                                    <div className="user-name">{profile?.name}</div>
                                    <div className="user-role">{profile?.role}</div>
                                </div>
                            </div>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => { onNavigate('dashboard'); setShowProfile(false); }}>
                                {IC.grid} Inicio
                            </button>
                            <button className="dropdown-item" onClick={() => { onNavigate('tickets'); setShowProfile(false); }}>
                                {IC.tickets} Mis Tickets
                            </button>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item text-error" onClick={logout}>
                                {IC.logout} Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
