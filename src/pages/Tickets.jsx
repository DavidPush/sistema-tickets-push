import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { IC } from '../assets/icons';
import { StatusBadge, PriorityBadge } from '../components/UI/Badges';
import { fmtShort, fmtId } from '../utils/helpers';

export function Tickets({ onSelect }) {
    const { tickets, cats, users } = useData();
    const { session } = useAuth();
    const [q, setQ] = useState('');
    const [dq, setDq] = useState(''); // Debounced query
    const [fStatus, setFStatus] = useState('all');
    const [fPrio, setFPrio] = useState('all');
    const [showClosed, setShowClosed] = useState(true);

    const profile = users.find(u => u.id === session?.user?.id);
    const isAdminOrTech = profile?.role === 'admin' || profile?.role === 'technician';

    useEffect(() => {
        const h = setTimeout(() => setDq(q), 300);
        return () => clearTimeout(h);
    }, [q]);

    const filtered = useMemo(() => {
        return tickets.filter(t => {
            const isOwner = t.creator_id === session?.user?.id;
            const canSee = isAdminOrTech || isOwner;
            if (!canSee) return false;

            if (!showClosed && t.status === 'closed') return false;

            const matchQ = t.title.toLowerCase().includes(dq.toLowerCase()) || t.id.toString().includes(dq);
            const matchS = fStatus === 'all' || t.status === fStatus;
            const matchP = fPrio === 'all' || t.priority === fPrio;
            return matchQ && matchS && matchP;
        });
    }, [tickets, dq, fStatus, fPrio, isAdminOrTech, session?.user?.id, showClosed]);

    return (
        <div className="fade-in">
            <div className="card card-pad mb-6">
                <div className="filter-bar">
                    <div className="input-icon-wrap">
                        <span className="input-icon">{IC.search}</span>
                        <input
                            className="form-input form-input-icon"
                            placeholder="Buscar por título o ID..."
                            value={q}
                            onChange={e => setQ(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">Estado</label>
                        <select className="form-input form-select" value={fStatus} onChange={e => setFStatus(e.target.value)}>
                            <option value="all">Todos los estados</option>
                            <option value="open">Abiertos</option>
                            <option value="in_progress">En Progreso</option>
                            <option value="waiting">Esperando</option>
                            <option value="closed">Cerrados</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Prioridad</label>
                        <select className="form-input form-select" value={fPrio} onChange={e => setFPrio(e.target.value)}>
                            <option value="all">Todas las prioridades</option>
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                        <label className="flex-center gap-2" style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={showClosed}
                                onChange={e => setShowClosed(e.target.checked)}
                            />
                            Mostrar Cerrados
                        </label>
                    </div>
                </div>
            </div>

            <div className="card">
                {filtered.length === 0 ? (
                    <div className="empty-state fade-in">
                        <div className="empty-state-icon">
                            {IC.search}
                        </div>
                        <h3 className="empty-state-title">No se encontraron tickets</h3>
                        <p className="empty-state-text">Intenta ajustar los filtros o la búsqueda para encontrar lo que necesitas.</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Categoría</th>
                                    <th>Estado</th>
                                    <th>Prioridad</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => {
                                    const c = cats.find(x => x.id === t.category_id);
                                    return (
                                        <tr key={t.id} onClick={() => onSelect(t.id)}>
                                            <td style={{ fontWeight: 700, color: 'var(--purple)', fontSize: 13 }}>{fmtId(t.id)}</td>
                                            <td style={{ fontWeight: 600 }}>{t.title}</td>
                                            <td><span style={{ fontSize: 16 }}>{c?.icon}</span> {c?.name}</td>
                                            <td><StatusBadge status={t.status} /></td>
                                            <td>
                                                <div className="flex-col">
                                                    <PriorityBadge priority={t.priority} />
                                                    {t.status !== 'closed' && (Date.now() - new Date(t.created_at) > 86400000) && (
                                                        <span className="sla-tag sla-overdue" style={{ fontSize: 10, marginTop: 2 }}>¡Atrasado!</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ color: '#999' }}>{fmtShort(t.created_at)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
