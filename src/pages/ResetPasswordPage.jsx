import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { IC } from '../assets/icons';
import logo from '../assets/logo.png';

export function ResetPasswordPage({ onComplete }) {
    const [pass, setPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const { updatePassword } = useAuth();
    const toast = useToast();

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        if (pass.length < 6) {
            setErr('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (pass !== confirm) {
            setErr('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await updatePassword(pass);
            toast('✅ Contraseña actualizada con éxito', 'success');
            onComplete();
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-bg">
            <div className="login-blob1" />
            <div className="login-blob2" />
            <div className="login-card fade-in">
                <div className="login-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <img src={logo} alt="Push HR" style={{ height: 'auto', maxHeight: 64, width: '100%', maxWidth: 280, objectFit: 'contain' }} />
                    <p style={{ color: '#64748b', marginTop: 12, fontSize: 13, fontWeight: 500, letterSpacing: '0.025em' }}>Help Desk System</p>
                </div>

                <h2 className="login-title">Nueva Contraseña</h2>
                <p className="login-sub">Ingresa tu nueva clave de acceso corporativo</p>

                {err && <div className="login-error shake">{IC.alert} {err}</div>}

                <form onSubmit={submit} className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Nueva Contraseña</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirmar Contraseña</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                        />
                    </div>

                    <button className="btn btn-purple w-full btn-lg mt-4" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Actualizar Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}
