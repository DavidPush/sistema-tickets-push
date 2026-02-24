import React from 'react';
import { IC } from '../assets/icons';
import { Avatar } from './UI/Avatar';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';
import logo from '../assets/logo.png';

export function Sidebar({ page, setPage, profile, users }) {
    const { logout } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const isTech = profile?.role === 'technician';
    const isUser = profile?.role === 'user';

    // Base items for everyone
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: IC.dashboard },
        { id: 'tickets', label: 'Tickets', icon: IC.ticket },
        { id: 'help', label: 'Centro de Ayuda', icon: IC.help },
    ];

    // Role specific additions
    if (isUser) {
        navItems.push({ id: 'create', label: 'Nuevo Ticket', icon: IC.plus });
    }

    if (isAdmin || isTech) {
        // Technicians and admins can see users (optionally) but let's stick to your current rules
        if (isAdmin) {
            navItems.push(
                { id: 'users', label: 'Usuarios', icon: IC.users },
                { id: 'categories', label: 'Categorías', icon: IC.settings }
            );
        }
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-logo" style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center' }}>
                <img
                    src={logo}
                    alt="Push HR"
                    style={{
                        height: 'auto',
                        maxHeight: 40,
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: 'brightness(0) invert(1)'
                    }}
                />
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
