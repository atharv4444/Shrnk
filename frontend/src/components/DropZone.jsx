import { useState, useRef, useCallback } from 'react'

function DropZone({ onFilesSelected, accept, multiple = true, label }) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [files, setFiles] = useState([])
    const inputRef = useRef()

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        const droppedFiles = Array.from(e.dataTransfer.files)
        setFiles(droppedFiles)
        onFilesSelected?.(droppedFiles)
    }, [onFilesSelected])

    const handleInputChange = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files)
        setFiles(selectedFiles)
        onFilesSelected?.(selectedFiles)
    }, [onFilesSelected])

    const handleClick = () => {
        inputRef.current?.click()
    }

    const removeFile = (index) => {
        const updated = files.filter((_, i) => i !== index)
        setFiles(updated)
        onFilesSelected?.(updated)
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }

    const totalSize = files.reduce((acc, f) => acc + f.size, 0)

    return (
        <div className="w-full">
            {/* Drop Area */}
            <div
                className={`drop-zone p-10 text-center ${isDragOver ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleInputChange}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-4">
                    {/* Upload Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragOver ? 'bg-fluid-accent/20 scale-110' : 'bg-surface-100 dark:bg-surface-800'}`}>
                        <svg className={`w-8 h-8 transition-colors ${isDragOver ? 'text-fluid-accent' : 'text-fluid-muted'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>

                    <div>
                        <p className="text-fluid-text font-semibold text-base">
                            {isDragOver ? 'Release to drop files' : label || 'Drop files here or click to browse'}
                        </p>
                        <p className="text-fluid-muted text-sm mt-1">
                            Supports any file type up to 2GB
                        </p>
                    </div>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2 animate-slide-up">
                    <div className="flex items-center justify-between px-1 mb-2">
                        <span className="text-xs font-semibold text-fluid-muted uppercase tracking-wider">
                            {files.length} file{files.length > 1 ? 's' : ''} selected
                        </span>
                        <span className="text-xs font-mono text-fluid-accent font-semibold">
                            {formatSize(totalSize)}
                        </span>
                    </div>

                    {files.map((file, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl bg-fluid-card border border-fluid-border backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-surface-50 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-fluid-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-fluid-text truncate">{file.name}</p>
                                    <p className="text-xs text-fluid-muted font-mono">{formatSize(file.size)}</p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group"
                            >
                                <svg className="w-4 h-4 text-fluid-muted group-hover:text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default DropZone
