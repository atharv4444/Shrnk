import { useNavigate } from 'react-router-dom'

function ModeSelector() {
    const navigate = useNavigate()

    const modes = [
        {
            id: 'archive',
            title: 'Archive Engine',
            subtitle: 'Zip & Unzip',
            description: 'Bundle files into encrypted archives or extract and peek inside existing ZIPs.',
            icon: (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8v13H3V8" />
                    <path d="M1 3h22v5H1z" />
                    <path d="M10 12h4" />
                </svg>
            ),
            gradient: 'from-brand-500 to-indigo-500',
            path: '/archive'
        },
        {
            id: 'image',
            title: 'Image Processor',
            subtitle: 'Resize & Strip',
            description: 'Batch resize images, strip EXIF metadata, and package results instantly.',
            icon: (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            ),
            gradient: 'from-purple-500 to-pink-500',
            path: '/image'
        }
    ]

    return (
        <div className="flex flex-col items-center pt-16 animate-slide-up">
            {/* Hero */}
            <div className="text-center mb-14">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-fluid-text mb-4">
                    File utilities,
                    <br />
                    <span className="bg-gradient-to-r from-fluid-accent to-purple-500 bg-clip-text text-transparent">
                        without the clutter.
                    </span>
                </h2>
                <p className="text-fluid-muted text-lg max-w-md mx-auto font-medium">
                    High-performance archiving and image processing — powered by in-stream pipelines.
                </p>
            </div>

            {/* Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                {modes.map((mode) => (
                    <button
                        key={mode.id}
                        id={`mode-${mode.id}`}
                        onClick={() => navigate(mode.path)}
                        className="glass-card p-8 text-left group focus:outline-none focus:ring-2 focus:ring-fluid-accent focus:ring-offset-2 focus:ring-offset-transparent"
                    >
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300`}>
                            {mode.icon}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-fluid-text mb-1">
                            {mode.title}
                        </h3>
                        <span className="inline-block text-xs font-semibold tracking-wider uppercase text-fluid-accent mb-3">
                            {mode.subtitle}
                        </span>

                        {/* Description */}
                        <p className="text-sm text-fluid-muted leading-relaxed">
                            {mode.description}
                        </p>

                        {/* Arrow */}
                        <div className="mt-5 flex items-center gap-2 text-fluid-accent text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                            Get started
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>
                    </button>
                ))}
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-12">
                {['AES-256 Encryption', 'Parallel Processing', 'EXIF Stripping', 'Streaming I/O', 'Real-time Progress'].map((feature) => (
                    <span
                        key={feature}
                        className="px-4 py-2 rounded-full text-xs font-semibold bg-fluid-card text-fluid-text border border-fluid-border shadow-sm backdrop-blur-sm"
                    >
                        {feature}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default ModeSelector
