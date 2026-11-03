import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useSession } from './lib/session';
import { Toaster } from '@project/components/ui/sonner';
import { MeProvider, useMe, REF_KEY } from './lib/me';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import History from './pages/History';
import Invite from './pages/Invite';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import Admin from './pages/Admin';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Compose from './pages/Compose';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';
import PostPage from './pages/PostPage';
import Bookmarks from './pages/Bookmarks';
import Layout from './components/Layout';
import Splash from './components/Splash';
import Blocked from './components/Blocked';

// Installed (home-screen) app skips the marketing landing: login → straight into the app.
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

function Join() {
  const { code } = useParams();
  useEffect(() => { if (code) localStorage.setItem(REF_KEY, code.toUpperCase().slice(0, 6)); }, [code]);
  return <Navigate to="/" replace />;
}

function SignedIn() {
  const { me, loading } = useMe();
  if (loading || !me) return <Splash />;
  if (!me.onboarded) return <Onboarding />;
  if (me.blocked) return <Blocked />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/reply" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/compose" element={<Compose />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/u/:username" element={<UserProfile />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/history" element={<History />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/admin" element={me.profile?.isAdmin ? <Admin /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const session = useSession();
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.classList.remove('dark');
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#fff8f5');
    document.documentElement.lang = 'fa';
    if (!document.title || document.title === 'Zite App') document.title = 'رو دست — جواب چی بدیم؟';
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" dir="rtl" richColors={false} closeButton duration={4500} gap={10} offset={16}
        toastOptions={{ className: 'rd-toast', classNames: { title: 'rd-toast-title', description: 'rd-toast-desc', icon: 'rd-toast-icon', closeButton: 'rd-toast-close' } }} />
      <Routes>
        <Route path="/join/:code" element={<Join />} />
        <Route path="*" element={
          !session ? (
            <Routes>
              <Route path="/terms" element={<Terms />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={isStandalone() ? <Navigate to="/login" replace /> : <Landing />} />
            </Routes>
          ) : <MeProvider key={session.token}><SignedIn /></MeProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}
