import { useNavigate, useLocation } from 'react-router-dom'

function Layout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const isHome = location.pathname === '/'

    return (
        <div className="min-h-screen flex flex-col">
            {/* ─── Header ─── */}
            <header className="w-full px-6 py-5 flex items-center justify-between">
                <div
                    className="flex items-center gap-2 cursor-pointer select-none group"
                    onClick={() => navigate('/')}
                >
                    {/* Logo Icon */}
                    <div className="relative w-9 h-9 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 opacity-90 group-hover:opacity-100 transition-opacity" />
                        <svg className="relative z-10 w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-surface-900">
                        Shrnk<span className="text-brand-500">.</span>
                    </h1>
                </div>

                {/* Nav Breadcrumb */}
                {!isHome && (
                    <nav className="flex items-center gap-2 text-sm animate-fade-in">
                        <button
                            onClick={() => navigate('/')}
                            className="text-surface-300 hover:text-brand-500 transition-colors font-medium"
                        >
                            Home
                        </button>
                        <span className="text-surface-200">/</span>
                        <span className="text-surface-800 font-semibold capitalize">
                            {location.pathname.slice(1)}
                        </span>
                    </nav>
                )}
            </header>

            {/* ─── Main Content ─── */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-12">
                {children}
            </main>

            {/* ─── Footer ─── */}
            <footer className="w-full py-6 text-center text-xs text-surface-300 font-medium tracking-wide">
                Built with precision &mdash; Shrnk. v1.0
            </footer>
        </div>
    )
}

export default Layout
