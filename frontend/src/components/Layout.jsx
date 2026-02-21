import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Layout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const isHome = location.pathname === '/'

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('shrnk-theme')
        if (saved) return saved === 'dark'
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    // Mount initial theme silently without animation
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    const toggleTheme = async (event) => {
        const newTheme = !isDark

        // Fallback for browsers without View Transitions API
        if (!document.startViewTransition) {
            setIsDark(newTheme)
            if (newTheme) {
                document.documentElement.classList.add('dark')
                localStorage.setItem('shrnk-theme', 'dark')
            } else {
                document.documentElement.classList.remove('dark')
                localStorage.setItem('shrnk-theme', 'light')
            }
            return
        }

        // Calculate clip path radius based on click position
        const x = event.clientX
        const y = event.clientY
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        )

        // Perform the DOM change hooked into the transition
        const transition = document.startViewTransition(() => {
            setIsDark(newTheme)
            if (newTheme) {
                document.documentElement.classList.add('dark')
                localStorage.setItem('shrnk-theme', 'dark')
            } else {
                document.documentElement.classList.remove('dark')
                localStorage.setItem('shrnk-theme', 'light')
            }
        })

        // Animate the pseudo-elements
        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
            ]

            document.documentElement.animate(
                {
                    clipPath: newTheme ? clipPath : [...clipPath].reverse(),
                },
                {
                    duration: 600,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    pseudoElement: newTheme
                        ? '::view-transition-new(root)'
                        : '::view-transition-old(root)',
                }
            )
        })
    }

    return (
        <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text transition-colors duration-0">
            {/* ─── Header ─── */}
            <header className="w-full px-6 py-5 flex items-center justify-between">
                <div
                    className="flex items-center gap-2 cursor-pointer select-none group"
                    onClick={() => navigate('/')}
                >
                    {/* Logo Icon */}
                    <div className="relative w-9 h-9 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-fluid-accent to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                        <svg className="relative z-10 w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-fluid-text">
                        Shrnk<span className="text-fluid-accent">.</span>
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    {/* Nav Breadcrumb */}
                    {!isHome && (
                        <nav className="flex items-center gap-2 text-sm animate-fade-in hidden sm:flex">
                            <button
                                onClick={() => navigate('/')}
                                className="text-fluid-muted hover:text-fluid-accent transition-colors font-medium"
                            >
                                Home
                            </button>
                            <span className="text-fluid-border">/</span>
                            <span className="text-fluid-text font-semibold capitalize">
                                {location.pathname.slice(1)}
                            </span>
                        </nav>
                    )}

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl border border-fluid-border bg-fluid-card text-fluid-muted hover:text-fluid-accent hover:border-fluid-accent/30 shadow-sm transition-all duration-300 group"
                        aria-label="Toggle Dark Mode"
                    >
                        <div className="relative w-5 h-5">
                            {/* SVG for Sun (Light Mode) */}
                            <svg
                                className={`absolute inset-0 w-full h-full transform transition-all duration-500 ease-out ${isDark ? 'opacity-0 rotate-[-90deg] scale-50' : 'opacity-100 rotate-0 scale-100 group-hover:rotate-[15deg]'}`}
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>

                            {/* SVG for Moon (Dark Mode) */}
                            <svg
                                className={`absolute inset-0 w-full h-full transform transition-all duration-500 ease-out ${!isDark ? 'opacity-0 rotate-[90deg] scale-50' : 'opacity-100 rotate-0 scale-100 group-hover:-rotate-[15deg]'}`}
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                <path d="M12 2v2" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                <path d="M5 5l1.5 1.5" className="opacity-0 group-hover:opacity-100 transition-opacity delay-75" />
                            </svg>
                        </div>
                    </button>
                </div>
            </header>

            {/* ─── Main Content ─── */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-12">
                {children}
            </main>

            {/* ─── Footer ─── */}
            <footer className="w-full py-6 text-center text-xs text-fluid-muted font-medium tracking-wide">
                Built with precision &mdash; Shrnk. v1.0
            </footer>
        </div>
    )
}

export default Layout
