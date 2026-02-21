function FileCard({ name, size }) {
    const formatSize = (bytes) => {
        if (!bytes) return ''
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
            return (
                <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            )
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return (
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 8v13H3V8" />
                    <path d="M1 3h22v5H1z" />
                    <path d="M10 12h4" />
                </svg>
            )
        }
        return (
            <svg className="w-5 h-5 text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
        )
    }

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-fluid-card border border-fluid-border backdrop-blur-sm hover:brightness-95 transition-all">
            <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                {getFileIcon(name)}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fluid-text truncate">{name}</p>
                {size && <p className="text-xs text-fluid-muted font-mono">{formatSize(size)}</p>}
            </div>
        </div>
    )
}

export default FileCard
