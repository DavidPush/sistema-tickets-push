import React from 'react';
import { IC } from '../assets/icons';
import { Avatar } from './UI/Avatar';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

export function Sidebar({ page, setPage, profile, users }) {
    const { logout } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const isUser = profile?.role === 'user';

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: IC.dashboard },
        { id: 'tickets', label: 'Tickets', icon: IC.ticket },
    ];

    if (isUser) {
        navItems.push({ id: 'create', label: 'Nuevo Ticket', icon: IC.plus });
    }

    if (isAdmin) {
        navItems.push(
            { id: 'users', label: 'Usuarios', icon: IC.users },
            { id: 'categories', label: 'Categorías', icon: IC.settings }
        );
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">P</div>
                <div>
                    <div className="sidebar-logo-text">Push <span>HR</span></div>
                    <div className="sidebar-logo-sub">Help Desk</div>
                </div>
            </div>
            <div className="sidebar-divider" />
            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`sidebar-link ${page === item.id ? 'active' : ''}`}
                        onClick={() => setPage(item.id)}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <Avatar name={profile?.name} size="sm" />
                    <div className="truncate">
                        <div className="sidebar-user-name">{profile?.name}</div>
                        <div className="sidebar-user-role">{ROLE_LABELS[profile?.role] || 'Usuario'}</div>
                    </div>
                </div>
                <button className="sidebar-logout" onClick={logout}>
                    {IC.logout}
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
