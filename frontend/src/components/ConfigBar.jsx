function ConfigBar({ config, onChange, mode }) {
    const handleChange = (key, value) => {
        onChange?.({ ...config, [key]: value })
    }

    return (
        <div className="config-bar p-6 space-y-5 animate-slide-down">
            <h3 className="text-sm font-bold text-fluid-text uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Configuration
            </h3>

            {/* Resize Option */}
            <div>
                <label className="block text-xs font-semibold text-fluid-text mb-2">
                    Image Resize
                </label>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { value: '', label: 'None' },
                        { value: '50', label: '50%' },
                        { value: '25', label: '25%' },
                        { value: 'custom', label: 'Custom' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => handleChange('resizeOption', opt.value)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${config.resizeOption === opt.value
                                ? 'bg-fluid-accent text-white shadow-md shadow-brand-200'
                                : 'bg-fluid-card text-fluid-text hover:brightness-95 border border-fluid-border'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Custom Dimensions */}
                {config.resizeOption === 'custom' && (
                    <div className="flex gap-2 mt-3 animate-slide-down">
                        <input
                            type="number"
                            placeholder="Width"
                            value={config.customWidth || ''}
                            onChange={(e) => handleChange('customWidth', e.target.value)}
                            className="input-field w-24 text-sm"
                        />
                        <span className="text-fluid-muted self-center font-bold">×</span>
                        <input
                            type="number"
                            placeholder="Height"
                            value={config.customHeight || ''}
                            onChange={(e) => handleChange('customHeight', e.target.value)}
                            className="input-field w-24 text-sm"
                        />
                    </div>
                )}
            </div>

            {/* Compression Level (Archive mode only) */}
            {mode === 'archive' && (
                <div>
                    <label className="block text-xs font-semibold text-fluid-text mb-2">
                        Compression Level
                    </label>
                    <div className="flex gap-2 flex-wrap mb-4">
                        {[
                            { value: 'STORE', label: 'Store (Fastest)' },
                            { value: 'NORMAL', label: 'Normal' },
                            { value: 'MAXIMUM', label: 'Maximum' },
                            { value: 'ULTRA', label: 'Ultra (Slowest)' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleChange('compressionLevel', opt.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${config.compressionLevel === opt.value
                                    ? 'bg-fluid-accent text-white shadow-md shadow-brand-200'
                                    : 'bg-fluid-card text-fluid-text hover:brightness-95 border border-fluid-border'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Password (Archive mode only) */}
            {mode === 'archive' && (
                <div>
                    <label className="block text-xs font-semibold text-fluid-text mb-2">
                        Password (AES-256)
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="Optional — leave blank for no encryption"
                            value={config.password || ''}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="input-field text-sm pr-10"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fluid-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Strip Metadata Toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-fluid-text">Strip EXIF Metadata</p>
                    <p className="text-[10px] text-fluid-muted mt-0.5">Remove GPS, camera info, etc.</p>
                </div>
                <div
                    className={`toggle ${config.stripMetadata ? 'active' : ''}`}
                    onClick={() => handleChange('stripMetadata', !config.stripMetadata)}
                    role="switch"
                    aria-checked={config.stripMetadata}
                />
            </div>
        </div>
    )
}

export default ConfigBar
