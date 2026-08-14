import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './useAuth';

export function ProtectedRoute({ children, requiredRole }: { children: ReactNode; requiredRole?: string }) {
  const { loading, user, profile } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLocation('/auth/login');
      return;
    }
    if (requiredRole && profile?.role !== requiredRole) {
      // Authenticated but not authorized
      setLocation('/auth/login');
    }
  }, [loading, user, profile, requiredRole, setLocation]);

  if (loading) {
    return (
      <div className="app-route-loading" role="status" aria-label="Ouverture de votre espace">
        <span className="app-route-loading-mark" aria-hidden="true">e</span>
        <span>Ouverture de votre espace…</span>
      </div>
    );
  }
  if (!user) return null;
  if (requiredRole && profile?.role !== requiredRole) return null;

  return <>{children}</>;
}

export default ProtectedRoute;
