import { useState } from 'react'

function FileTree({ entries, onSelectionChange }) {
    const [selected, setSelected] = useState(new Set())
    const [expanded, setExpanded] = useState(new Set())

    const toggleSelect = (path) => {
        const next = new Set(selected)
        if (next.has(path)) {
            next.delete(path)
        } else {
            next.add(path)
        }
        setSelected(next)
        onSelectionChange?.(Array.from(next))
    }

    const toggleExpand = (path) => {
        const next = new Set(expanded)
        if (next.has(path)) {
            next.delete(path)
        } else {
            next.add(path)
        }
        setExpanded(next)
    }

    const selectAll = () => {
        const allPaths = entries.filter(e => !e.directory).map(e => e.path)
        const next = new Set(allPaths)
        setSelected(next)
        onSelectionChange?.(allPaths)
    }

    const selectNone = () => {
        setSelected(new Set())
        onSelectionChange?.([])
    }

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    // Build tree structure
    const buildTree = (entries) => {
        const tree = {}
        entries.forEach(entry => {
            const parts = entry.path.replace(/\/$/, '').split('/')
            let current = tree
            parts.forEach((part, i) => {
                if (!current[part]) {
                    current[part] = {
                        _entry: i === parts.length - 1 ? entry : null,
                        _children: {}
                    }
                }
                current = current[part]._children
            })
        })
        return tree
    }

    const renderNode = (name, node, path, depth = 0) => {
        const entry = node._entry
        const children = Object.entries(node._children)
        const isDir = entry?.directory || children.length > 0
        const isExpanded = expanded.has(path)
        const isSelected = selected.has(path)

        return (
            <div key={path} style={{ paddingLeft: `${depth * 20}px` }}>
                <div className="file-tree-item flex items-center gap-2 group">
                    {/* Expand/Collapse for dirs */}
                    {isDir ? (
                        <button
                            onClick={() => toggleExpand(path)}
                            className="w-5 h-5 flex items-center justify-center rounded transition-transform"
                        >
                            <svg
                                className={`w-3 h-3 text-fluid-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    ) : (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(path)}
                            className="w-4 h-4 rounded border-fluid-border text-brand-500 focus:ring-brand-300 cursor-pointer ml-0.5"
                        />
                    )}

                    {/* Icon */}
                    {isDir ? (
                        <svg className="w-4 h-4 text-fluid-accent" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-fluid-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                    )}

                    {/* Name */}
                    <span className="text-sm text-fluid-text font-medium truncate">
                        {name}
                    </span>

                    {/* Size */}
                    {!isDir && entry && (
                        <span className="text-xs text-fluid-muted font-mono ml-auto">
                            {formatSize(entry.size)}
                        </span>
                    )}
                </div>

                {/* Children */}
                {isDir && isExpanded && children.map(([childName, childNode]) =>
                    renderNode(childName, childNode, `${path}/${childName}`.replace(/^\//, ''), depth + 1)
                )}
            </div>
        )
    }

    const tree = buildTree(entries || [])

    return (
        <div className="w-full">
            {/* Actions */}
            <div className="flex items-center gap-3 mb-3 px-1">
                <button onClick={selectAll} className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                    Select All
                </button>
                <span className="text-fluid-border">|</span>
                <button onClick={selectNone} className="text-xs font-semibold text-fluid-muted hover:text-fluid-text transition-colors">
                    Select None
                </button>
                <span className="ml-auto text-xs font-mono text-fluid-muted">
                    {selected.size} selected
                </span>
            </div>

            {/* Tree */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-fluid-border bg-fluid-card p-2">
                {Object.entries(tree).map(([name, node]) =>
                    renderNode(name, node, name, 0)
                )}
                {(!entries || entries.length === 0) && (
                    <p className="text-center text-sm text-fluid-muted py-6">No files found</p>
                )}
            </div>
        </div>
    )
}

export default FileTree
