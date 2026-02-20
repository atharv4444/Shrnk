function ProgressRing({ percent = 0, size = 120, strokeWidth = 8, eta, status, label }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percent / 100) * circumference

    const displayPercent = Math.min(100, Math.max(0, Math.round(percent)))

    return (
        <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background Ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="rgba(139, 92, 246, 0.1)"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Progress Ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="url(#progressGradient)"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="progress-ring-circle"
                    />
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-surface-900 font-mono tabular-nums">
                        {displayPercent}%
                    </span>
                    {status && (
                        <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider mt-0.5">
                            {status}
                        </span>
                    )}
                </div>
            </div>

            {/* Label & ETA */}
            <div className="text-center">
                {label && (
                    <p className="text-sm text-surface-800 font-medium truncate max-w-[200px]">
                        {label}
                    </p>
                )}
                {eta && (
                    <p className="text-xs text-surface-300 font-mono mt-1">
                        ETA: {eta}
                    </p>
                )}
            </div>
        </div>
    )
}

export default ProgressRing
