import React from 'react';
import { STATUSES, PRIORITIES } from '../../utils/constants';

export function StatusBadge({ status }) {
    const cfg = STATUSES[status] || { label: status, cls: '' };
    return (
        <span className={`badge ${cfg.cls}`}>
            <span className="badge-dot" />
            {cfg.label}
        </span>
    );
}

export function PriorityBadge({ priority }) {
    const cfg = PRIORITIES[priority] || { label: priority, cls: '' };
    return (
        <span className={`badge ${cfg.cls}`}>
            <span className="badge-dot" />
            {cfg.label}
        </span>
    );
}
