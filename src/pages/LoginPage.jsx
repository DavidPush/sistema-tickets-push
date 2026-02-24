import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { IC } from '../assets/icons';
import { useToast } from '../context/ToastContext';
import logo from '../assets/logo.png';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [name, setName] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [msgSent, setMsgSent] = useState(false);
    const toast = useToast();

    const validateEmail = (e) => e.toLowerCase().endsWith('@pushhr.cl');

    const submit = async e => {
        e.preventDefault();
        setErr('');
        setMsgSent(false);
        setLoading(true);

        if (!validateEmail(email)) {
            setErr('Solo se permiten correos @Pushhr.cl');
            setLoading(false);
            return;
        }

        try {
            if (isSignup) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password: pass,
                    options: {
                        data: { full_name: name },
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                setMsgSent(true);
                // Reset form
                setName('');
                setPass('');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
                if (error) throw error;
            }
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    const loginMicrosoft = async () => {
        toast('🌐 Estamos trabajando en conjunto con Microsoft para habilitar el acceso corporativo próximamente. ¡Gracias por tu paciencia!', 'info');
    };

    const loginMagicLink = async () => {
        if (!validateEmail(email)) {
            setErr('Ingresa un correo @pushhr.cl válido');
            return;
        }
        setErr('');
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: window.location.origin }
            });
            if (error) throw error;
            setMsgSent(true);
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

                <h2 className="login-title">{isSignup ? 'Crea tu cuenta' : '¡Bienvenido!'}</h2>
                <p className="login-sub">{isSignup ? 'Regístrate con tu correo corporativo' : 'Inicia sesión para gestionar tus tickets'}</p>

                {err && <div className="login-error shake">{IC.alert} {err}</div>}

                <form onSubmit={submit} className="space-y-4">
                    {isSignup && (
                        <div className="form-group">
                            <label className="form-label">Nombre Completo</label>
                            <input
                                className="form-input"
                                placeholder="Juan Pérez"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Correo Corporativo</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="usuario@pushhr.cl"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            required
                        />
                    </div>

                    <button className="btn btn-purple w-full btn-lg mt-2" disabled={loading}>
                        {loading ? <span className="spinner" /> : (isSignup ? 'Registrarse' : 'Entrar Now')}
                    </button>

                    {!isSignup && (
                        <>
                            <div className="login-divider">
                                <span>o continuar con</span>
                            </div>

                            <div className="grid-2-gap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button type="button" className="btn btn-outline flex-center gap-2 msg-auth-btn" onClick={loginMicrosoft} disabled={loading} title="Vía Microsoft Oauth">
                                    {IC.microsoft} Microsoft
                                </button>
                                <button type="button" className="btn btn-outline flex-center gap-2 msg-auth-btn" onClick={loginMagicLink} disabled={loading} title="Entra sin contraseña">
                                    {IC.mail} Sin Clave
                                </button>
                            </div>

                            {msgSent && (
                                <div className="fade-in" style={{ background: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {IC.check} {isSignup ? '¡Registro casi listo! Confirma en tu email.' : '¡Enlace enviado! Revisa tu email.'}
                                </div>
                            )}
                        </>
                    )}

                    {isSignup && msgSent && (
                        <div className="fade-in" style={{ background: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {IC.check} ¡Gracias por registrarte! Te enviamos un correo de confirmación.
                        </div>
                    )}
                </form>

                <div className="text-center mt-6">
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsSignup(!isSignup)}>
                        {isSignup ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
                    </button>
                </div>
            </div>
        </div>
    );
}
