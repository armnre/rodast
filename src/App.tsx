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
import Layout from './components/Layout';
import Splash from './components/Splash';
import Blocked from './components/Blocked';

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
    document.documentElement.classList.add('dark');
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#0c0914');
    document.documentElement.lang = 'fa';
    document.title = 'رو دست — جواب چی بدیم؟';
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" dir="rtl" />
      <Routes>
        <Route path="/join/:code" element={<Join />} />
        <Route path="*" element={
          !session ? (
            <Routes>
              <Route path="/terms" element={<Terms />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          ) : <MeProvider key={session.token}><SignedIn /></MeProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}
