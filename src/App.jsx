import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useMembership } from './hooks/useMembership';
import { OrgContext } from './lib/orgContext';
import { isManager, homePathFor } from './lib/roles';
import { he } from './locales/he';
import LoginPage from './pages/LoginPage';
import OrgSetupPage from './pages/OrgSetupPage';
import AppShell from './components/AppShell';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import MyTasksPage from './pages/MyTasksPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import MockupsPage from './pages/MockupsPage';

// שער כניסה: מחליט לאן לנווט לפי מצב ההתחברות והחברות בארגון.
export default function App() {
  const { session, user, loading: authLoading } = useAuth();
  const { member, loading: memLoading, refetch } = useMembership(user?.id);

  if (authLoading || (session && memLoading)) {
    return <FullScreenLoader />;
  }

  const ctx = { session, user, member, refetchMember: refetch };

  return (
    <OrgContext.Provider value={ctx}>
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

        {/* אזור מחובר — דורש session + חברות בארגון. AppShell אחיד לכל המסכים. */}
        {/* מוקאפים — סטטי לגמרי: נתוני דמה, אפס שאילתות, אפס כתיבה.
            פתוח בכוונה כדי שניתן יהיה לצפות ולצלם בלי חשבון. אם החלופה
            תיבחר — הנתיב הזה יוסר יחד עם תיקיית src/mockups. */}
        <Route path="/mockups" element={<MockupsPage />} />

        <Route element={<Protected session={session} member={member} />}>
          <Route element={<AppShell />}>
            {/* נחיתה לפי תפקיד: מנהל ללוח, עובד/ראש צוות למשימות שלו */}
            <Route path="/" element={<Navigate to={homePathFor(member)} replace />} />
            <Route path="/my" element={<MyTasksPage />} />

            {/* מסכי ניהול — עובד/ראש צוות מנותבים ל-/my */}
            <Route element={<ManagerOnly member={member} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/clients/:clientId" element={<ClientDetailPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OrgContext.Provider>
  );
}

// שומר סף לאזור המחובר
function Protected({ session, member }) {
  if (!session) return <Navigate to="/login" replace />;
  if (!member) return <Navigate to="/setup" replace />;
  return <Outlet />;
}

// שומר סף למסכי ניהול. זו הגנת UX בלבד — האבטחה עצמה ב-RLS.
function ManagerOnly({ member }) {
  if (!isManager(member)) return <Navigate to="/my" replace />;
  return <Outlet />;
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <p className="text-lg text-slate-500">{he.common.loading}</p>
    </div>
  );
}
