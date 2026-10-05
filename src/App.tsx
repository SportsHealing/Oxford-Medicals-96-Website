import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import RequireMember from './components/RequireMember.tsx'
import Landing from './pages/Landing.tsx'
import SignIn from './pages/SignIn.tsx'
import Gallery from './pages/Gallery.tsx'
import PhotoView from './pages/PhotoView.tsx'
import Classmates from './pages/Classmates.tsx'
import Profile from './pages/Profile.tsx'
import Contact from './pages/Contact.tsx'
import Me from './pages/Me.tsx'
import Admin from './pages/Admin.tsx'
import Privacy from './pages/Privacy.tsx'
import NotFound from './pages/NotFound.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="privacy" element={<Privacy />} />
        <Route element={<RequireMember />}>
          <Route path="photos" element={<Gallery />} />
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
