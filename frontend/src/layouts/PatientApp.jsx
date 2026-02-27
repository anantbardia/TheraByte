import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { SoftBlob, FloatingRing, DotGrid } from '../components/Decorations'
import './PatientApp.css'

const I = {
    brain: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 1 5 5v0a3 3 0 0 1 3 3 4 4 0 0 1-1.5 7.5" /><path d="M12 2a5 5 0 0 0-5 5v0a3 3 0 0 0-3 3 4 4 0 0 0 1.5 7.5" /><path d="M12 2v20" /></svg>,
    chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>,
    tools: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    video: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 10 6-3v10l-6-3" /></svg>,
    community: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    sos: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
}

const PatientApp = ({ auth, onLogout }) => {
    const nav = useNavigate()

    return (
        <div className="platform-shell">
            {/* ── Soft Background Decor for the entire patient app ── */}
            <DotGrid style={{ zIndex: 0 }} />
            <SoftBlob color="var(--primary-mint-dim)" size={400} style={{ top: '-10%', right: '-10%' }} />
            <FloatingRing color="rgba(219, 156, 116, 0.15)" size={200} thickness={1} style={{ bottom: '10%', right: '5%' }} />
            <SoftBlob color="rgba(162, 210, 202, 0.1)" size={300} style={{ bottom: '-5%', left: '10%' }} className="delay-3" />

            <aside className="platform-sidebar">
                <div className="ps-brand">
                    <img src="/images/therabyte-icon.png" alt="TheraByte" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                </div>
                <nav className="ps-nav">
                    <NavLink to="/app/chat" className={({ isActive }) => `ps-btn ${isActive ? 'active' : ''}`} title="AI Support">{I.chat}</NavLink>
                    <NavLink to="/app/profile" className={({ isActive }) => `ps-btn ${isActive ? 'active' : ''}`} title="My Profile">{I.user}</NavLink>
                    <NavLink to="/app/tools" className={({ isActive }) => `ps-btn ${isActive ? 'active' : ''}`} title="Wellness Tools">{I.tools}</NavLink>
                    <NavLink to="/app/sessions" className={({ isActive }) => `ps-btn ${isActive ? 'active' : ''}`} title="Session History">{I.history}</NavLink>
                    <NavLink to="/app/community" className={({ isActive }) => `ps-btn ${isActive ? 'active' : ''}`} title="Peer Support Groups">{I.community}</NavLink>
                    <div className="ps-divider" />
                    <NavLink to="/app/video" className={({ isActive }) => `ps-btn ${isActive ? 'active' : ''}`} title="Video Session">{I.video}</NavLink>
                    <div className="ps-spacer" />
                    <button className="ps-sos" title="Emergency SOS" onClick={() => nav('/app/chat')}>{I.sos}</button>
                    <button className="ps-btn" title="Logout" onClick={onLogout}>{I.logout}</button>
                </nav>
                <div className="ps-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
                </div>
            </aside>
            <main className="platform-main">
                <Outlet />
            </main>
        </div>
    )
}

export default PatientApp
