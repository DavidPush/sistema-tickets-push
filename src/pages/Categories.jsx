import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { IC } from '../assets/icons';
import { useToast } from '../context/ToastContext';

export function Categories() {
    const { cats, addCat, updateCat, deleteCat } = useData();
    const toast = useToast();
    const [newCat, setNewCat] = useState({ name: '', icon: '📁' });
    const [editing, setEditing] = useState(null);

    const saveNew = async () => {
        if (!newCat.name.trim()) return;
        try {
            await addCat(newCat);
            setNewCat({ name: '', icon: '📁' });
            toast('Categoría creada');
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    const saveEdit = async (c) => {
        try {
            await updateCat(c.id, c);
            setEditing(null);
            toast('Categoría actualizada');
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    const del = async (id) => {
        if (!confirm('¿Eliminar categoría? Los tickets asociados podrían quedar huérfanos.')) return;
        try {
            await deleteCat(id);
            toast('Categoría eliminada');
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    return (
        <div className="fade-in">
            <div className="grid-3 mb-6">
                <div className="card card-pad">
                    <h4 className="mb-4">Nueva Categoría</h4>
                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label">Nombre</label>
                            <input className="form-input" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="Ej: Redes" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Emoji / Icono</label>
                            <input className="form-input" value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} />
                        </div>
                        <button className="btn btn-purple w-full" onClick={saveNew}>Crear Categoría</button>
                    </div>
                </div>

                {cats.map(c => (
                    <div key={c.id} className="cat-card fade-in">
                        {editing?.id === c.id ? (
                            <div className="space-y-3">
                                <input className="form-input" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                                <input className="form-input" value={editing.icon} onChange={e => setEditing({ ...editing, icon: e.target.value })} />
                                <div className="flex-center gap-2">
                                    <button className="btn btn-primary btn-sm w-full" onClick={() => saveEdit(editing)}>Guardar</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>{IC.x}</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-between mb-2">
                                    <span style={{ fontSize: 24 }}>{c.icon}</span>
                                    <div className="flex-center gap-1">
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>{IC.edit}</button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => del(c.id)}>{IC.trash}</button>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>ID: {c.id}</div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
