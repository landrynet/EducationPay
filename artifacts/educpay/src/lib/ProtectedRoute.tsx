import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './useAuth';

export type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
};

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { loading, user, profile } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // 1. Not authenticated -> Login
    if (!user) {
      setLocation('/auth/login');
      return;
    }

    const role = profile?.role;
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isEstablishmentUser = role === 'DIRECTOR' || role === 'ESTABLISHMENT_ADMIN' || role === 'ACCOUNTANT' || role === 'TUTOR';

    // 2. Inactive account check
    if (profile?.is_active === false) {
      setLocation('/auth/login');
      return;
    }

    // 3. Super Admin attempting to access Establishment space (/app/*)
    if (isSuperAdmin && (location === '/app' || location.startsWith('/app/'))) {
      setLocation('/super-admin');
      return;
    }

    // 4. Establishment user attempting to access Super Admin space (/super-admin/*)
    if (isEstablishmentUser && (location === '/super-admin' || location.startsWith('/super-admin/'))) {
      setLocation('/app');
      return;
    }

    // 5. Explicit role check
    const rolesAllowed = allowedRoles || (requiredRole ? [requiredRole] : undefined);
    if (rolesAllowed && role && !rolesAllowed.includes(role)) {
      if (isSuperAdmin) {
        setLocation('/super-admin');
      } else {
        setLocation('/app');
      }
    }
  }, [loading, user, profile, requiredRole, allowedRoles, location, setLocation]);

  if (loading) {
    return (
      <div className="app-route-loading" role="status" aria-label="Ouverture de votre espace">
        <span className="app-route-loading-mark" aria-hidden="true">e</span>
        <span>Ouverture de votre espace…</span>
      </div>
    );
  }

  if (!user) return null;
  if (profile?.is_active === false) return null;

  const role = profile?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isEstablishmentUser = role === 'DIRECTOR' || role === 'ESTABLISHMENT_ADMIN' || role === 'ACCOUNTANT' || role === 'TUTOR';

  if (isSuperAdmin && (location === '/app' || location.startsWith('/app/'))) return null;
  if (isEstablishmentUser && (location === '/super-admin' || location.startsWith('/super-admin/'))) return null;

  const rolesAllowed = allowedRoles || (requiredRole ? [requiredRole] : undefined);
  if (rolesAllowed && role && !rolesAllowed.includes(role)) return null;

  return <>{children}</>;
}

export default ProtectedRoute;
