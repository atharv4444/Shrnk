import { useState } from 'react'
import DropZone from '../components/DropZone'
import ConfigBar from '../components/ConfigBar'
import ProgressRing from '../components/ProgressRing'
import FileCard from '../components/FileCard'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/image'

function ImagePage() {
    const [files, setFiles] = useState([])
    const [config, setConfig] = useState({
        resizeOption: '50',
        stripMetadata: false,
        customWidth: '',
        customHeight: '',
    })
    const [progress, setProgress] = useState({ percent: 0, status: '', eta: '', label: '' })
    const [isProcessing, setIsProcessing] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [previews, setPreviews] = useState([])

    const handleFilesSelected = (selectedFiles) => {
        setFiles(selectedFiles)
        // Create image previews
        const newPreviews = selectedFiles
            .filter(f => f.type.startsWith('image/'))
            .slice(0, 8)
            .map(f => ({
                name: f.name,
                url: URL.createObjectURL(f),
                size: f.size,
            }))
        setPreviews(newPreviews)
    }

    const getResizeValue = () => {
        if (config.resizeOption === 'custom' && config.customWidth && config.customHeight) {
            return `${config.customWidth}x${config.customHeight}`
        }
        return config.resizeOption
    }

    const handleResize = async () => {
        if (files.length === 0) return
        setIsProcessing(true)
        setError(null)
        setResult(null)
        setProgress({ percent: 0, status: 'Uploading', eta: '', label: '' })

        const formData = new FormData()
        files.forEach(f => formData.append('files', f))
        formData.append('resizeOption', getResizeValue())
        formData.append('stripMetadata', config.stripMetadata)

        try {
            const xhr = new XMLHttpRequest()

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = (e.loaded / e.total) * 50
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

                let serverProgress = 50
                const interval = setInterval(() => {
                    serverProgress = Math.min(serverProgress + 3, 95)
                    setProgress(p => ({ ...p, percent: serverProgress, status: 'Resizing' }))
                }, 200)
                xhr.onloadend = () => clearInterval(interval)

                xhr.open('POST', `${API_BASE}/resize`)
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

    const handleStripOnly = async () => {
        if (files.length === 0) return
        setIsProcessing(true)
        setError(null)
        setResult(null)

        const formData = new FormData()
        files.forEach(f => formData.append('files', f))

        try {
            const res = await fetch(`${API_BASE}/strip-metadata`, { method: 'POST', body: formData })
            if (!res.ok) throw new Error('Metadata stripping failed')
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
        previews.forEach(p => URL.revokeObjectURL(p.url))
        setFiles([])
        setPreviews([])
        setResult(null)
        setProgress({ percent: 0, status: '', eta: '', label: '' })
        setError(null)
    }

    return (
        <div className="animate-slide-up">
            {/* Page Title */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight">
                    Image Processor
                </h2>
                <p className="text-surface-300 mt-1 font-medium">
                    Batch resize images and strip EXIF metadata — powered by parallel processing.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Drop Zone */}
                    <div className="glass-card-static p-6">
                        <DropZone
                            onFilesSelected={handleFilesSelected}
                            accept="image/*"
                            multiple={true}
                            label="Drop images here to process"
                        />
                    </div>

                    {/* Image Previews */}
                    {previews.length > 0 && !isProcessing && !result && (
                        <div className="glass-card-static p-6 animate-slide-up">
                            <h3 className="text-sm font-bold text-surface-800 uppercase tracking-wider mb-4">
                                🖼️ Preview
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {previews.map((preview, i) => (
                                    <div key={i} className="group relative rounded-xl overflow-hidden aspect-square bg-surface-50">
                                        <img
                                            src={preview.url}
                                            alt={preview.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                            <p className="text-[10px] text-white font-medium truncate">{preview.name}</p>
                                            <p className="text-[9px] text-white/70 font-mono">
                                                {(preview.size / 1024).toFixed(0)} KB
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {files.length > 8 && (
                                <p className="text-xs text-surface-300 text-center mt-3">
                                    + {files.length - 8} more images
                                </p>
                            )}
                        </div>
                    )}

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

                    {/* Result */}
                    {result && (
                        <div className="glass-card-static p-6 animate-slide-up">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-surface-900">✅ Images Processed!</h3>
                                    <p className="text-sm text-surface-300 mt-1">
                                        {result.totalFiles} files processed
                                        {result.size && ` • Output: ${(result.size / 1024 / 1024).toFixed(2)} MB`}
                                    </p>
                                </div>
                                <button onClick={handleDownload} className="btn-primary">
                                    Download ZIP
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
                    <ConfigBar config={config} onChange={setConfig} mode="image" />

                    {/* Action Buttons */}
                    <button
                        onClick={handleResize}
                        disabled={files.length === 0 || isProcessing || !config.resizeOption}
                        className="btn-primary w-full text-center"
                    >
                        {isProcessing ? 'Processing...' : '🔄 Resize Images'}
                    </button>

                    <button
                        onClick={handleStripOnly}
                        disabled={files.length === 0 || isProcessing}
                        className="btn-secondary w-full text-center"
                    >
                        🔒 Strip Metadata Only
                    </button>

                    {result && (
                        <button onClick={resetAll} className="btn-secondary w-full text-center">
                            Start Over
                        </button>
                    )}

                    {/* Info Card */}
                    <div className="glass-card-static p-5 text-xs text-surface-300 space-y-2">
                        <p className="font-semibold text-surface-800 text-sm">How it works</p>
                        <p>Images are processed using Java parallel streams for maximum throughput.</p>
                        <p>EXIF stripping removes GPS coordinates, camera model, and other private data.</p>
                        <p>Results are packaged as a ZIP for easy download.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ImagePage
