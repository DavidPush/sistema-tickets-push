import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { IC } from '../assets/icons';

export function KnowledgeBase({ onNavigate }) {
    const { faqs, cats, users } = useData();
    const { session } = useAuth();
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('all');

    const filtered = faqs.filter(f => {
        const matchesSearch = f.question.toLowerCase().includes(search.toLowerCase()) ||
            f.answer.toLowerCase().includes(search.toLowerCase());
        const matchesCat = selectedCat === 'all' || f.category_id === parseInt(selectedCat);
        return matchesSearch && matchesCat;
    });

    return (
        <div className="fade-in">
            <div className="flex-between mb-8">
                <div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Centro de Ayuda</h2>
                    <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.6 }}>Encuentra respuestas rápidas o contacta a soporte</p>
                </div>
                <div className="flex-center gap-3">
                    {session?.user && !['admin', 'technician'].includes(users.find(u => u.id === session.user.id)?.role) && (
                        <button className="btn btn-purple" onClick={() => onNavigate('create')} style={{ gap: 8 }}>
                            {IC.plus} Nuevo Ticket
                        </button>
                    )}
                </div>
            </div>

            <div className="card card-pad mb-8">
                <div className="flex-center gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar en el Centro de Ayuda..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 40 }}
                        />
                        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                            {IC.search}
                        </div>
                    </div>
                    <select
                        className="form-input"
                        style={{ width: 200 }}
                        value={selectedCat}
                        onChange={e => setSelectedCat(e.target.value)}
                    >
                        <option value="all">Todas las categorías</option>
                        {cats.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="flex-center flex-col py-20 bg-white rounded-2xl border-dashed border-2 border-gray-200" style={{ border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: 64, marginBottom: 20 }}>🤔</div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No encontramos lo que buscas</h3>
                    <p style={{ color: '#64748b', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
                        Intenta con otras palabras clave o categorías. Si el problema persiste, nuestro equipo está listo para ayudarte.
                    </p>
                    {session?.user && !['admin', 'technician'].includes(users.find(u => u.id === session.user.id)?.role) && (
                        <button className="btn btn-purple" onClick={() => onNavigate('create')}>
                            Crear Ticket de Soporte
                        </button>
                    )}
                </div>
            ) : (
                <div className="faq-grid">
                    {filtered.map(f => {
                        const cat = cats.find(c => c.id === f.category_id);
                        return (
                            <div key={f.id} className="card card-pad faq-card">
                                <div className="flex-between mb-3">
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        color: cat?.color || 'var(--purple)',
                                        background: (cat?.color || 'var(--purple)') + '15',
                                        padding: '2px 8px',
                                        borderRadius: 4
                                    }}>
                                        {cat?.name || 'General'}
                                    </span>
                                    <span style={{ fontSize: 12, color: '#999' }}>{new Date(f.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 style={{ fontSize: 16, marginBottom: 12, lineHeight: 1.4, fontWeight: 700 }}>{f.question}</h3>
                                <div className="faq-answer" style={{ marginTop: 8 }}>{f.answer}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
