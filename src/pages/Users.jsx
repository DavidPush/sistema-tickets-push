import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { IC } from '../assets/icons';
import { Avatar } from '../components/UI/Avatar';
import { ROLE_LABELS } from '../utils/constants';
import { useToast } from '../context/ToastContext';

export function Users() {
    const { users, updateUser, deleteUser } = useData();
    const toast = useToast();
    const [editing, setEditing] = useState(null);

    const save = async (u) => {
        try {
            await updateUser(u.id, u);
            setEditing(null);
            toast('Usuario actualizado');
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    const del = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
        try {
            await deleteUser(id);
            toast('Usuario eliminado');
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    return (
        <div className="fade-in">
            <div className="card">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Departamento</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ cursor: 'default' }}>
                                    <td>
                                        <div className="flex-center gap-3">
                                            <Avatar name={u.name} size="sm" />
                                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#666' }}>{u.email}</td>
                                    <td>
                                        {editing?.id === u.id ? (
                                            <select className="form-input form-select" value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}>
                                                <option value="admin">Administrador</option>
                                                <option value="technician">Técnico</option>
                                                <option value="user">Usuario</option>
                                            </select>
                                        ) : (
                                            <span className={`badge badge-${u.role}`}>{ROLE_LABELS[u.role]}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editing?.id === u.id ? (
                                            <input className="form-input" value={editing.department} onChange={e => setEditing({ ...editing, department: e.target.value })} />
                                        ) : (
                                            u.department
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex-center gap-2">
                                            {editing?.id === u.id ? (
                                                <>
                                                    <button className="btn btn-primary btn-sm" onClick={() => save(editing)}>{IC.check}</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>{IC.x}</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(u)}>{IC.edit}</button>
                                                    <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => del(u.id)}>{IC.trash}</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
