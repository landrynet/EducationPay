import {
  ArrowDownToLine,
  BookOpen,
  CalendarDays,
  CircleHelp,
  Gauge,
  Landmark,
  Settings2,
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

export const navigationItems: NavigationItem[] = [
  { label: 'Vue d’ensemble', href: '/app', icon: Gauge, description: 'Votre espace de pilotage' },
  { label: 'Demandes', href: '/app/establishments', icon: ClipboardCheck, description: 'Valider les établissements' },
  { label: 'Établissement', href: '/app/establishment', icon: Landmark, description: 'Repères de votre structure' },
  { label: 'Équipe', href: '/app/team', icon: UsersRound, description: 'Les personnes qui travaillent ici' },
  { label: 'Ressources', href: '/app/resources', icon: BookOpen, description: 'Documents et repères utiles' },
  { label: 'Calendrier', href: '/app/calendar', icon: CalendarDays, description: 'Les prochaines échéances' },
];

export const secondaryNavigationItems: NavigationItem[] = [
  { label: 'Paramètres', href: '/app/settings', icon: Settings2, description: 'Préparer votre espace' },
  { label: 'Aide', href: '/app/help', icon: CircleHelp, description: 'Questions et accompagnement' },
];

export const getNavigationItem = (pathname: string) =>
  [...navigationItems, ...secondaryNavigationItems].find(
    (item) => item.href === pathname,
  ) ?? navigationItems[0];

export const ExportIcon = ArrowDownToLine;