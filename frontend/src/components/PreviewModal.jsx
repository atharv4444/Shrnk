import { useEffect, useState } from 'react'

function PreviewModal({ isOpen, onClose, fileUrl, fileName }) {
    if (!isOpen) return null;

    const [isLoading, setIsLoading] = useState(true);

    // Prevent scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
            setIsLoading(true);
        }
    }, [isOpen]);

    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
    const isPdf = /\.pdf$/i.test(fileName);
    const isText = /\.(txt|md|csv|json|js|jsx|css|html|xml|log)$/i.test(fileName);

    // We only preview native web formats directly well
    const canPreview = isImage || isPdf || isText;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-fluid-card border border-fluid-border shadow-2xl rounded-2xl overflow-hidden animate-slide-up">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-fluid-border bg-surface-50 dark:bg-surface-800">
                    <div className="flex items-center gap-3 min-w-0">
                        <svg className="w-5 h-5 text-fluid-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <circle cx="10" cy="13" r="2" />
                            <path d="m20 21-3.5-3.5" />
                        </svg>
                        <h3 className="text-base font-bold text-fluid-text truncate">
                            {fileName}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg hover:bg-fluid-accent/10 transition-colors text-fluid-accent"
                            title="Open in new tab"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-fluid-muted hover:text-red-500"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="relative flex-1 bg-surface-100 dark:bg-black/50 overflow-auto flex items-center justify-center p-4 min-h-[400px]">

                    {isLoading && canPreview && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-fluid-bg z-10">
                            <svg className="w-8 h-8 text-fluid-accent animate-spin mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm font-medium text-fluid-muted animate-pulse">Loading preview...</p>
                        </div>
                    )}

                    {!canPreview ? (
                        <div className="text-center p-8">
                            <div className="w-16 h-16 rounded-2xl bg-surface-200 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-fluid-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-fluid-text mb-2">No Preview Available</h4>
                            <p className="text-sm text-fluid-muted max-w-sm mx-auto">
                                We cannot preview this file type directly in the browser. You can extract it or open it in a new tab to download.
                            </p>
                        </div>
                    ) : isImage ? (
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-full max-h-full object-contain shadow-lg"
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                    ) : (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full min-h-[60vh] border-0 rounded bg-white shadow-inner"
                            onLoad={() => setIsLoading(false)}
                            title={fileName}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default PreviewModal
