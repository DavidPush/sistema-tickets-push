import { AVATAR_BG } from './constants';

export const genId = () => Date.now() + Math.floor(Math.random() * 9999);

export const initials = n => (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const avatarBg = n => AVATAR_BG[(n || '').length % AVATAR_BG.length];

export const timeAgo = ds => {
    const s = Math.floor((Date.now() - new Date(ds)) / 1e3);
    if (s < 60) return 'hace un momento';
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h}h`;
    const dd = Math.floor(h / 24);
    if (dd < 30) return `hace ${dd}d`;
    return new Date(ds).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

export const fmtDate = ds => new Date(ds).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const fmtShort = ds => new Date(ds).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
