import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { IC } from '../assets/icons';
import { StatusBadge, PriorityBadge } from '../components/UI/Badges';
import { timeAgo } from '../utils/helpers';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export function Dashboard({ onNavigate }) {
    const { tickets, users } = useData();
    const { session } = useAuth();

    const profile = users.find(u => u.id === session?.user?.id);
    const isAdminOrTech = profile?.role === 'admin' || profile?.role === 'technician';

    const myTickets = useMemo(() => {
        return tickets.filter(t => isAdminOrTech || t.creator_id === session?.user?.id);
    }, [tickets, isAdminOrTech, session?.user?.id]);

    const stats = useMemo(() => {
        const s = { open: 0, in_progress: 0, waiting: 0, closed: 0, critical: 0 };
        myTickets.forEach(t => {
            if (s[t.status] !== undefined) s[t.status]++;
            if (t.priority === 'critical' && t.status !== 'closed') s.critical++;
        });
        return s;
    }, [myTickets]);

    const recent = [...myTickets].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5);

    const statusData = {
        labels: ['Abiertos', 'En Progreso', 'Esperando', 'Cerrados'],
        datasets: [{
            data: [
                myTickets.filter(t => t.status === 'open').length,
                myTickets.filter(t => t.status === 'in_progress').length,
                myTickets.filter(t => t.status === 'waiting').length,
                myTickets.filter(t => t.status === 'closed').length,
            ],
            backgroundColor: ['#3b82f6', '#f59e0b', '#7c3aed', '#10b981'],
        }]
    };

    const priorityData = {
        labels: ['Baja', 'Media', 'Alta', 'Crítica'],
        datasets: [{
            label: 'Tickets',
            data: [
                myTickets.filter(t => t.priority === 'low').length,
                myTickets.filter(t => t.priority === 'medium').length,
                myTickets.filter(t => t.priority === 'high').length,
                myTickets.filter(t => t.priority === 'critical').length,
            ],
            backgroundColor: '#5A3FA3',
            borderRadius: 6,
        }]
    };

    return (
        <div className="fade-in">
            <div className="grid-5 mb-6">
                <StatCard label="Abiertos" val={stats.open} icon={<div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>{IC.inbox}</div>} />
                <StatCard label="En Progreso" val={stats.in_progress} icon={<div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>{IC.clock}</div>} />
                <StatCard label="Esperando" val={stats.waiting} icon={<div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>{IC.clock}</div>} />
                <StatCard label="Cerrados" val={stats.closed} icon={<div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>{IC.check}</div>} />
                <StatCard label="Críticos" val={stats.critical} icon={<div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>{IC.alert}</div>} />
            </div>

            <div className="grid-23 mb-6">
                <div className="card card-pad">
                    <h3 className="mb-4">Tickets por Estado</h3>
                    <div style={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                        <Pie data={statusData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card card-pad">
                    <h3 className="mb-4">Tickets por Prioridad</h3>
                    <div style={{ height: 300 }}>
                        <Bar data={priorityData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex-between card-pad pb-0">
                    <h3>Actividad Reciente</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tickets')}>Ver todos {IC.chevRight}</button>
                </div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr><th>Ticket</th><th>Estado</th><th>Prioridad</th><th>Actualizado</th></tr>
                        </thead>
                        <tbody>
                            {recent.map(t => (
                                <tr key={t.id} onClick={() => onNavigate('detail', t.id)}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                                        <div style={{ fontSize: 12, color: '#999' }}>#{t.id}</div>
                                    </td>
                                    <td><StatusBadge status={t.status} /></td>
                                    <td><PriorityBadge priority={t.priority} /></td>
                                    <td style={{ fontSize: 12, color: '#999' }}>{timeAgo(t.updated_at)}</td>
                                </tr>
                            ))}
                            {recent.length === 0 && <tr><td colSpan="4" className="text-center p-8 color-999">No hay tickets recientes</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, val, icon }) {
    return (
        <div className="stat-card">
            {icon}
            <div className="stat-val">{val}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
