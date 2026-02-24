export const PRIORITIES = {
    low: { label: 'Baja', cls: 'badge-low' },
    medium: { label: 'Media', cls: 'badge-medium' },
    high: { label: 'Alta', cls: 'badge-high' },
    critical: { label: 'Crítica', cls: 'badge-critical' }
};

export const STATUSES = {
    open: { label: 'Abierto', cls: 'badge-open' },
    in_progress: { label: 'En Progreso', cls: 'badge-in_progress' },
    waiting: { label: 'Esperando', cls: 'badge-waiting' },
    closed: { label: 'Cerrado', cls: 'badge-closed' }
};

export const ROLE_LABELS = {
    admin: 'Administrador',
    technician: 'Técnico',
    user: 'Usuario'
};

export const AVATAR_BG = [
    '#5A3FA3', '#4BB7B5', '#E7B547', '#2563eb', '#059669',
    '#ec4899', '#6366f1', '#e11d48', '#0891b2', '#7c3aed'
];

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
