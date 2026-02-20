import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ModeSelector from './components/ModeSelector'
import ArchivePage from './pages/ArchivePage'
import ImagePage from './pages/ImagePage'

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<ModeSelector />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="/image" element={<ImagePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    )
}

export default App
