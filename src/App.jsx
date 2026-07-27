import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useMembership } from './hooks/useMembership';
import { he } from './locales/he';
import LoginPage from './pages/LoginPage';
import OrgSetupPage from './pages/OrgSetupPage';
import WelcomePage from './pages/WelcomePage';

// שער כניסה: מחליט לאן לנווט לפי מצב ההתחברות והחברות בארגון.
export default function App() {
  const { session, user, loading: authLoading } = useAuth();
  const { member, loading: memLoading, refetch } = useMembership(user?.id);

  if (authLoading || (session && memLoading)) {
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/setup"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : member ? (
            <Navigate to="/" replace />
          ) : (
            <OrgSetupPage onCreated={refetch} />
          )
        }
      />
      <Route
        path="/"
        element={
          !session ? (
            <Navigate to="/login" replace />
          ) : !member ? (
            <Navigate to="/setup" replace />
          ) : (
            <WelcomePage member={member} />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <p className="text-lg text-slate-500">{he.common.loading}</p>
    </div>
  );
}
