import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LoginPage } from './pages/LoginPage';
import { IC } from './assets/icons';
import { supabase } from './services/supabase';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Tickets } from './pages/Tickets';
import { TicketDetail } from './pages/TicketDetail';
import { CreateTicket } from './pages/CreateTicket';
import { Users } from './pages/Users';
import { Categories } from './pages/Categories';

function AppContent() {
    const { session, loadingAuth, logout } = useAuth();
    const { users, tickets, loading: loadingData } = useData();
    const [page, setPage] = useState('dashboard');
    const [selTicket, setSelTicket] = useState(null);
    const [showMobile, setShowMobile] = useState(false);

    const profile = users.find(u => u.id === session?.user?.id);

    useEffect(() => {
        // Auto-create profile if missing and authenticated
        if (session?.user && !profile && !loadingData) {
            const createProfile = async () => {
                try {
                    await supabase.from('profiles').insert([{
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                        role: 'user',
                        department: 'General'
                    }]);
                } catch (e) {
                    console.error("Auto-profile creation failed:", e);
                }
            };
            createProfile();
        }
    }, [session, profile, loadingData]);

    useEffect(() => {
        if (showMobile) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
    }, [showMobile]);

    if (loadingAuth || (loadingData && tickets.length === 0)) return (
        <div className="login-bg">
            <span className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--purple)', borderTopColor: 'transparent' }} />
        </div>
    );
    if (!session) return <LoginPage />;

    // Minimal loading while profile is being auto-created
    if (!profile) return (
        <div className="login-bg">
            <div className="text-center" style={{ color: 'white' }}>
                <span className="spinner" style={{ width: 40, height: 40, borderColor: 'white', borderTopColor: 'transparent', marginBottom: 20 }} />
                <p>Preparando tu espacio de trabajo...</p>
            </div>
        </div>
    );

    const titles = {
        dashboard: { t: 'Dashboard', s: 'Vista general del sistema' },
        tickets: { t: 'Tickets', s: 'Gestión de tickets' },
        create: { t: 'Nuevo Ticket', s: 'Crear solicitud' },
        detail: { t: `Ticket #${selTicket || ''}`, s: 'Detalle del ticket' },
        users: { t: 'Usuarios', s: 'Gestión de usuarios' },
        categories: { t: 'Categorías', s: 'Configuración' }
    };
    const ti = titles[page] || titles.dashboard;

    const isAdmin = profile?.role === 'admin';

    const renderPage = () => {
        switch (page) {
            case 'dashboard': return <Dashboard onNavigate={(p, id) => {
                if (id) setSelTicket(id);
                setPage(p);
            }} />;
            case 'tickets': return <Tickets onSelect={id => { setSelTicket(id); setPage('detail'); }} />;
            case 'create': return <CreateTicket onNavigate={setPage} />;
            case 'detail': return <TicketDetail id={selTicket} onNavigate={setPage} />;
            case 'users': return isAdmin ? <Users /> : <Dashboard onNavigate={setPage} />;
            case 'categories': return isAdmin ? <Categories /> : <Dashboard onNavigate={setPage} />;
            default: return <Dashboard onNavigate={setPage} />;
        }
    };

    return (
        <div className="app-layout scale-in">
            <Sidebar page={page} setPage={p => { setPage(p); setShowMobile(false); }} profile={profile} />

            {showMobile && (
                <div className="mobile-overlay">
                    <div className="mobile-overlay-bg fade-in" onClick={() => setShowMobile(false)} />
                    <div className="mobile-sidebar slide-right">
                        <Sidebar page={page} setPage={p => { setPage(p); setShowMobile(false); }} profile={profile} />
                    </div>
                </div>
            )}

            <main className="main-area">
                <Topbar title={ti.t} sub={ti.s} profile={profile} onToggleMobile={() => setShowMobile(true)} onNavigate={setPage} onSelectTicket={setSelTicket} />
                <div className="page-content">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <DataProvider>
                <NotificationProvider>
                    <ToastProvider>
                        <AppContent />
                    </ToastProvider>
                </NotificationProvider>
            </DataProvider>
        </AuthProvider>
    );
}
