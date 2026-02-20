import { useState, useCallback } from 'react'
import DropZone from '../components/DropZone'
import ConfigBar from '../components/ConfigBar'
import ProgressRing from '../components/ProgressRing'
import FileTree from '../components/FileTree'
import FileCard from '../components/FileCard'

const API_BASE = '/api/archive'

function ArchivePage() {
    const [mode, setMode] = useState('zip') // 'zip' | 'unzip' | 'peek'
    const [files, setFiles] = useState([])
    const [config, setConfig] = useState({
        resizeOption: '',
        password: '',
        stripMetadata: false,
        customWidth: '',
        customHeight: '',
    })
    const [progress, setProgress] = useState({ percent: 0, status: '', eta: '', label: '' })
    const [isProcessing, setIsProcessing] = useState(false)
    const [result, setResult] = useState(null)
    const [peekEntries, setPeekEntries] = useState(null)
    const [selectedPaths, setSelectedPaths] = useState([])
    const [error, setError] = useState(null)

    const getResizeValue = () => {
        if (config.resizeOption === 'custom' && config.customWidth && config.customHeight) {
            return `${config.customWidth}x${config.customHeight}`
        }
        return config.resizeOption
    }

    const handleZip = async () => {
        if (files.length === 0) return
        setIsProcessing(true)
        setError(null)
        setResult(null)
        setProgress({ percent: 0, status: 'Uploading', eta: '', label: '' })

        const formData = new FormData()
        files.forEach(f => formData.append('files', f))
        if (config.password) formData.append('password', config.password)
        const resize = getResizeValue()
        if (resize) formData.append('resizeOption', resize)
        formData.append('stripMetadata', config.stripMetadata)

        try {
            const xhr = new XMLHttpRequest()

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = (e.loaded / e.total) * 50 // Upload is 50% of total
                    setProgress(p => ({
                        ...p,
                        percent: pct,
                        status: 'Uploading',
                        label: `${(e.loaded / 1024 / 1024).toFixed(1)} MB / ${(e.total / 1024 / 1024).toFixed(1)} MB`,
                    }))
                }
            }

            const response = await new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText))
                    } else {
                        reject(new Error(JSON.parse(xhr.responseText)?.error || 'Processing failed'))
                    }
                }
                xhr.onerror = () => reject(new Error('Network error'))

                // Simulate server progress
                let serverProgress = 50
                const interval = setInterval(() => {
                    serverProgress = Math.min(serverProgress + 2, 95)
                    setProgress(p => ({ ...p, percent: serverProgress, status: 'Compressing' }))
                }, 200)
                xhr.onloadend = () => clearInterval(interval)

                xhr.open('POST', `${API_BASE}/zip`)
                xhr.send(formData)
            })

            setProgress({ percent: 100, status: 'Complete', eta: '', label: '' })
            setResult(response)
        } catch (e) {
            setError(e.message)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleUnzip = async () => {
        if (files.length === 0) return
        setIsProcessing(true)
        setError(null)
        setResult(null)
        setProgress({ percent: 0, status: 'Uploading', eta: '', label: '' })

        const formData = new FormData()
        formData.append('file', files[0])
        if (config.password) formData.append('password', config.password)

        try {
            const xhr = new XMLHttpRequest()

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = (e.loaded / e.total) * 50
                    setProgress(p => ({ ...p, percent: pct, status: 'Uploading' }))
                }
            }

            const response = await new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText))
                    } else {
                        reject(new Error(JSON.parse(xhr.responseText)?.error || 'Extraction failed'))
                    }
                }
                xhr.onerror = () => reject(new Error('Network error'))

                let serverProgress = 50
                const interval = setInterval(() => {
                    serverProgress = Math.min(serverProgress + 3, 95)
                    setProgress(p => ({ ...p, percent: serverProgress, status: 'Extracting' }))
                }, 200)
                xhr.onloadend = () => clearInterval(interval)

                xhr.open('POST', `${API_BASE}/unzip`)
                xhr.send(formData)
            })

            setProgress({ percent: 100, status: 'Complete', eta: '', label: '' })
            setResult(response)
        } catch (e) {
            setError(e.message)
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePeek = async () => {
        if (files.length === 0) return
        setIsProcessing(true)
        setError(null)
        setPeekEntries(null)

        const formData = new FormData()
        formData.append('file', files[0])
        if (config.password) formData.append('password', config.password)

        try {
            const res = await fetch(`${API_BASE}/peek`, { method: 'POST', body: formData })
            if (!res.ok) throw new Error('Failed to peek into archive')
            const entries = await res.json()
            setPeekEntries(entries)
        } catch (e) {
            setError(e.message)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleExtractSelected = async () => {
        if (files.length === 0 || selectedPaths.length === 0) return
        setIsProcessing(true)
        setError(null)
        setResult(null)

        const formData = new FormData()
        formData.append('file', files[0])
        selectedPaths.forEach(p => formData.append('paths', p))
        if (config.password) formData.append('password', config.password)

        try {
            const res = await fetch(`${API_BASE}/extract-selected`, { method: 'POST', body: formData })
            if (!res.ok) throw new Error('Selective extraction failed')
            const response = await res.json()
            setResult(response)
        } catch (e) {
            setError(e.message)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDownload = () => {
        if (!result?.sessionId) return
        window.open(`${API_BASE}/download/${result.sessionId}`, '_blank')
    }

    const resetAll = () => {
        setFiles([])
        setResult(null)
        setPeekEntries(null)
        setSelectedPaths([])
        setProgress({ percent: 0, status: '', eta: '', label: '' })
        setError(null)
    }

    return (
        <div className="animate-slide-up">
            {/* Page Title */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">
                    Archive Engine
                </h2>
                <p className="text-surface-300 mt-1 font-medium">
                    Compress, extract, and explore ZIP archives with AES-256 encryption.
                </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'zip', label: 'Create ZIP', icon: '📦' },
                    { id: 'unzip', label: 'Extract', icon: '📂' },
                    { id: 'peek', label: 'Peek Inside', icon: '👁️' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setMode(tab.id); resetAll() }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === tab.id
                                ? 'bg-brand-500 text-white shadow-lg shadow-brand-200'
                                : 'bg-white/60 text-surface-800 hover:bg-white/90 border border-white/80'
                            }`}
                    >
                        <span className="mr-1.5">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Drop Zone */}
                    <div className="glass-card-static p-6">
                        <DropZone
                            onFilesSelected={setFiles}
                            accept={mode !== 'zip' ? '.zip' : undefined}
                            multiple={mode === 'zip'}
                            label={mode === 'zip' ? 'Drop files to compress' : 'Drop a .zip file'}
                        />
                    </div>

                    {/* Processing State */}
                    {isProcessing && (
                        <div className="glass-card-static p-8 flex justify-center">
                            <ProgressRing
                                percent={progress.percent}
                                status={progress.status}
                                eta={progress.eta}
                                label={progress.label}
                            />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-slide-up">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    {/* Peek Results */}
                    {peekEntries && (
                        <div className="glass-card-static p-6 animate-slide-up">
                            <h3 className="text-sm font-bold text-surface-800 uppercase tracking-wider mb-4">
                                📋 Archive Contents
                            </h3>
                            <FileTree entries={peekEntries} onSelectionChange={setSelectedPaths} />
                            {selectedPaths.length > 0 && (
                                <div className="mt-4 flex gap-3">
                                    <button onClick={handleExtractSelected} className="btn-primary text-sm">
                                        Extract Selected ({selectedPaths.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="glass-card-static p-6 animate-slide-up">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-surface-900">✅ Done!</h3>
                                    <p className="text-sm text-surface-300 mt-1">
                                        {result.fileName && `File: ${result.fileName}`}
                                        {result.totalFiles && ` • ${result.totalFiles} files`}
                                        {result.size && ` • ${(result.size / 1024 / 1024).toFixed(2)} MB`}
                                    </p>
                                </div>
                                <button onClick={handleDownload} className="btn-primary">
                                    Download
                                </button>
                            </div>

                            {result.files && (
                                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                                    {result.files.map((f, i) => (
                                        <FileCard key={i} name={f.name} size={f.size} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Config Sidebar */}
                <div className="space-y-4">
                    <ConfigBar config={config} onChange={setConfig} mode="archive" />

                    {/* Action Button */}
                    <button
                        onClick={mode === 'zip' ? handleZip : mode === 'unzip' ? handleUnzip : handlePeek}
                        disabled={files.length === 0 || isProcessing}
                        className="btn-primary w-full text-center"
                    >
                        {isProcessing ? 'Processing...' : mode === 'zip' ? '🗜️ Create Archive' : mode === 'unzip' ? '📂 Extract All' : '👁️ Peek Inside'}
                    </button>

                    {result && (
                        <button onClick={resetAll} className="btn-secondary w-full text-center">
                            Start Over
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ArchivePage
