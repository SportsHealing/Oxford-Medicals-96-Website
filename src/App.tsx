import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import RequireMember from './components/RequireMember.tsx'
import Landing from './pages/Landing.tsx'
import SignIn from './pages/SignIn.tsx'
import Gallery from './pages/Gallery.tsx'
import Classmates from './pages/Classmates.tsx'
import NotFound from './pages/NotFound.tsx'

// Less-visited pages load on first visit, keeping the first download small.
const AddPhotos = lazy(() => import('./pages/AddPhotos.tsx'))
const PhotoView = lazy(() => import('./pages/PhotoView.tsx'))
const Profile = lazy(() => import('./pages/Profile.tsx'))
const Contact = lazy(() => import('./pages/Contact.tsx'))
const Me = lazy(() => import('./pages/Me.tsx'))
const Admin = lazy(() => import('./pages/Admin.tsx'))
const Privacy = lazy(() => import('./pages/Privacy.tsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="privacy" element={<Privacy />} />
        <Route element={<RequireMember />}>
          <Route path="photos" element={<Gallery />} />
          <Route path="photos/new" element={<AddPhotos />} />
          <Route path="photos/:id" element={<PhotoView />} />
          <Route path="classmates" element={<Classmates />} />
          <Route path="classmates/:id" element={<Profile />} />
          <Route path="classmates/:id/contact" element={<Contact />} />
          <Route path="me" element={<Me />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
