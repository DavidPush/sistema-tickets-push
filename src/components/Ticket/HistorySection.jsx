import React, { useMemo } from 'react';
import { fmtDate } from '../../utils/helpers';
import { IC } from '../../assets/icons';

export function HistorySection({ history, users }) {
    const userMap = useMemo(() => {
        const map = {};
        users.forEach(u => { map[u.id] = u; });
        return map;
    }, [users]);

    if (history.length === 0) {
        return (
            <div className="flex-center flex-col gap-3 py-10 opacity-50">
                <div className="stat-icon" style={{ background: '#f5f5f5' }}>{IC.clock}</div>
                <p style={{ fontSize: 13 }}>No hay actividad registrada aún.</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            {history.map(h => {
                const u = userMap[h.user_id];
                return (
                    <div key={h.id} className="hist-item">
                        <div className="hist-dot" />
                        <div>
                            <div className="hist-text"><strong>{u?.name || 'Sistema'}</strong>: {h.action}</div>
                            <div className="hist-time">{fmtDate(h.created_at)}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
