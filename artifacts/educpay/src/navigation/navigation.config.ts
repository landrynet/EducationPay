import {
  ArrowDownToLine,
  CalendarDays,
  CircleHelp,
  Gauge,
  Landmark,
  School,
  Settings2,
  ShieldAlert,
  UsersRound,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

// Super Admin Navigation (Platform Scope Only)
export const superAdminNavigationItems: NavigationItem[] = [
  { label: 'Plateforme', href: '/super-admin', icon: Gauge, description: 'Vue d’ensemble EducPAY' },
  { label: 'Demandes & Tenants', href: '/super-admin/establishments', icon: ClipboardCheck, description: 'Validation des établissements' },
  { label: 'Administration', href: '/super-admin/platform', icon: ShieldAlert, description: 'Supervision technique' },
];

export const superAdminSecondaryNavigationItems: NavigationItem[] = [
  { label: 'Paramètres plateforme', href: '/super-admin/settings', icon: Settings2, description: 'Configuration globale' },
];

// Establishment Admin Navigation (Single Tenant Business Scope Only)
export const establishmentNavigationItems: NavigationItem[] = [
  { label: 'Vue d’ensemble', href: '/app', icon: Gauge, description: 'Votre espace de pilotage' },
  { label: 'Établissement', href: '/app/establishment', icon: Landmark, description: 'Repères de votre structure' },
  { label: 'Année scolaire', href: '/app/school-years', icon: School, description: 'Configuration académique' },
  { label: 'Tuteurs', href: '/app/team', icon: UsersRound, description: 'Les contacts et référents' },
];

export const establishmentSecondaryNavigationItems: NavigationItem[] = [
  { label: 'Paramètres', href: '/app/settings', icon: Settings2, description: 'Préparer votre espace' },
];

// Fallback / Combined for utility lookups
export const getNavigationItemsForRole = (role?: string) => {
  if (role === 'SUPER_ADMIN') {
    return {
      main: superAdminNavigationItems,
      secondary: superAdminSecondaryNavigationItems,
    };
  }
  return {
    main: establishmentNavigationItems,
    secondary: establishmentSecondaryNavigationItems,
  };
};

export const getNavigationItem = (pathname: string, role?: string) => {
  const { main, secondary } = getNavigationItemsForRole(role);
  const all = [...main, ...secondary];
  return all.find((item) => item.href === pathname) ?? (role === 'SUPER_ADMIN' ? superAdminNavigationItems[0] : establishmentNavigationItems[0]);
};

export const ExportIcon = ArrowDownToLine;