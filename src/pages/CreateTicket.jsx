import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { IC } from '../assets/icons';

export function CreateTicket({ onNavigate }) {
    const { session } = useAuth();
    const { cats, addTicket, addHistory } = useData();
    const toast = useToast();

    const [form, setForm] = useState({ title: '', description: '', categoryId: '', priority: 'medium' });
    const [errs, setErrs] = useState({});
    const [loading, setLoading] = useState(false);

    const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const submit = async e => {
        e.preventDefault();
        const er = {};
        if (!form.title.trim()) er.title = 'El título es obligatorio';
        if (!form.description.trim()) er.description = 'La descripción es obligatoria';
        if (!form.categoryId) er.categoryId = 'Selecciona una categoría';
        if (Object.keys(er).length) { setErrs(er); return; }

        setLoading(true);
        try {
            const ticket = await addTicket({
                title: form.title,
                description: form.description,
                category_id: parseInt(form.categoryId),
                priority: form.priority,
                status: 'open',
                creator_id: session.user.id,
                updated_at: new Date().toISOString()
            });

            await addHistory({
                ticket_id: ticket.id,
                user_id: session.user.id,
                action: 'Ticket creado'
            });

            toast('Ticket creado exitosamente');
            onNavigate('tickets');
        } catch (e) {
            toast('Error al crear ticket: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <button className="back-btn" onClick={() => onNavigate('tickets')}>
                {IC.arrowLeft} Volver a la lista
            </button>

            <div className="card card-pad">
                <h2 className="mb-6">Crear Nuevo Ticket</h2>
                <form onSubmit={submit} className="space-y-4">
                    <div className="form-group">
                        <div className="flex-between">
                            <label className="form-label">Título de la solicitud</label>
                            <span style={{ fontSize: 11, color: form.title.length > 80 ? '#ef4444' : '#999' }}>
                                {form.title.length}/100
                            </span>
                        </div>
                        <input
                            className={`form-input ${errs.title ? 'border-danger' : ''}`}
                            placeholder="Ej: Mi laptop no enciende"
                            value={form.title}
                            maxLength={100}
                            onChange={e => upd('title', e.target.value)}
                        />
                        {errs.title && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errs.title}</div>}
                    </div>

                    <div className="grid-2">
                        <div>
                            <label className="form-label">Categoría</label>
                            <select
                                className={`form-input form-select ${errs.categoryId ? 'border-danger' : ''}`}
                                value={form.categoryId}
                                onChange={e => upd('categoryId', e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                            </select>
                            {errs.categoryId && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errs.categoryId}</div>}
                        </div>
                        <div>
                            <label className="form-label">Prioridad</label>
                            <select
                                className="form-input form-select"
                                value={form.priority}
                                onChange={e => upd('priority', e.target.value)}
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="flex-between">
                            <label className="form-label">Descripción detallada</label>
                            <span style={{ fontSize: 11, color: form.description.length > 450 ? '#ef4444' : '#999' }}>
                                {form.description.length}/500
                            </span>
                        </div>
                        <textarea
                            className={`form-input ${errs.description ? 'border-danger' : ''}`}
                            placeholder="Explica detalladamente el problema..."
                            value={form.description}
                            maxLength={500}
                            style={{ minHeight: 120 }}
                            onChange={e => upd('description', e.target.value)}
                        />
                        {errs.description && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errs.description}</div>}
                    </div>

                    <div className="flex-between mt-6">
                        <button type="button" className="btn btn-secondary" onClick={() => onNavigate('tickets')}>Cancelar</button>
                        <button type="submit" className="btn btn-purple btn-lg" disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Crear Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
