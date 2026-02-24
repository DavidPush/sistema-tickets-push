import React from 'react';
import { initials, avatarBg } from '../../utils/helpers';

export function Avatar({ name, size = 'md', className = '' }) {
    return (
        <div
            className={`avatar avatar-${size} ${className}`}
            style={{ backgroundColor: avatarBg(name) }}
        >
            {initials(name)}
        </div>
    );
}
