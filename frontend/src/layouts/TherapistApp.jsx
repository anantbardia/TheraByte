import { Outlet, NavLink } from 'react-router-dom'
import { SoftBlob, DotGrid } from '../components/Decorations'
import './TherapistApp.css'

const TherapistApp = ({ auth, onLogout }) => {
    return (
        <div className="t-shell">
            {/* ── Soft Background Decor for the entire therapist app ── */}
            <DotGrid style={{ zIndex: 0 }} />
            <SoftBlob color="rgba(126, 191, 181, 0.08)" size={500} style={{ top: '-10%', right: '-10%' }} />

            <header className="t-header">
                <div className="t-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/images/therabyte-icon.png" alt="TheraByte" style={{ height: '34px', width: '34px', objectFit: 'contain' }} />
                    <div>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>TheraByte</span>
                        <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: '12px' }}>Therapist Portal — Dr. {auth.name}</p>
                    </div>
                </div>
                <nav className="t-nav">
                    <NavLink to="/therapist/patients" className={({ isActive }) => `tn ${isActive ? 'active' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Patients
                    </NavLink>
                    <button className="tn tn-logout" onClick={onLogout}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </nav>
            </header>
            <main className="t-main">
                <Outlet />
            </main>
        </div>
    )
}

export default TherapistApp
