'use client';
import { MessageCircle } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import AuthScreen from '@/components/auth/AuthScreen';
import Workspace from '@/components/layout/Workspace';
export default function App() {
  const session = useSession();
  if (session.loading)
    return (
      <div className="app-loading">
        <span className="brand-mark">
          <MessageCircle size={27} fill="currentColor" />
        </span>
        <p>Making room for your conversations…</p>
      </div>
    );
  if (!session.user)
    return <AuthScreen initialError={session.error} onAuthenticated={session.setUser} />;
  return (
    <Workspace
      user={session.user}
      onUpdated={session.setUser}
      onLogout={session.logout}
      onPasswordChanged={() => session.setUser(null)}
    />
  );
}
