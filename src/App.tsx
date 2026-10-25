import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import CodeGate from './components/CodeGate.tsx'
import Layout from './components/Layout.tsx'
import Landing from './pages/Landing.tsx'
import NotFound from './pages/NotFound.tsx'

// Pages behind the class code load on first visit, keeping the front page small.
const Gallery = lazy(() => import('./pages/Gallery.tsx'))
const PhotoView = lazy(() => import('./pages/PhotoView.tsx'))
const Speeches = lazy(() => import('./pages/Speeches.tsx'))
const SpeechView = lazy(() => import('./pages/SpeechView.tsx'))
const MapPage = lazy(() => import('./pages/MapPage.tsx'))
const Privacy = lazy(() => import('./pages/Privacy.tsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="privacy" element={<Privacy />} />
        <Route element={<CodeGate />}>
          <Route path="photos" element={<Gallery />} />
          <Route path="photos/:id" element={<PhotoView />} />
          <Route path="speeches" element={<Speeches />} />
          <Route path="speeches/:slug" element={<SpeechView />} />
          <Route path="map" element={<MapPage />} />
        </Route>
        {/* Addresses from the sign-in era, in case anyone kept a link. */}
        {['sign-in', 'classmates', 'classmates/*', 'me', 'admin', 'photos/new'].map((p) => (
          <Route key={p} path={p} element={<Navigate to="/" replace />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
