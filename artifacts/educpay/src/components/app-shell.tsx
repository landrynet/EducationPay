import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/useAuth';
import { Link, useLocation } from 'wouter';
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from 'lucide-react';
import {
  getNavigationItem,
  navigationItems,
  secondaryNavigationItems,
} from '@/navigation/navigation.config';

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/app"
      aria-label="EducPAY, accueil de l’application"
      className="app-brand rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <span className="app-brand-mark" aria-hidden="true">
        <span>e</span>
      </span>
      {!compact ? <span className="app-brand-name">EducPAY</span> : null}
    </Link>
  );
}

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const isActive = (href: string) =>
    href === '/app' ? location === href : location.startsWith(href);

  return (
    <nav
      aria-label="Navigation principale"
      className={`app-nav ${collapsed ? 'app-nav-collapsed' : ''}`}
    >
      <div>
        {!collapsed ? <p className="app-nav-label">Espace de travail</p> : null}
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={`app-nav-link ${isActive(item.href) ? 'is-active' : ''}`}
              >
                <Icon className="app-nav-icon" strokeWidth={1.8} />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
                {isActive(item.href) && !collapsed ? (
                  <ChevronRight className="ml-auto size-3.5 opacity-60" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
      <div>
        {!collapsed ? <p className="app-nav-label">Configuration</p> : null}
        <div className="space-y-1">
          {secondaryNavigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={`app-nav-link ${isActive(item.href) ? 'is-active' : ''}`}
              >
                <Icon className="app-nav-icon" strokeWidth={1.8} />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Sidebar({
  collapsed = false,
  mobile = false,
  onClose,
}: {
  collapsed?: boolean;
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside
      id={mobile ? undefined : 'educpay-desktop-sidebar'}
      className={`app-sidebar ${collapsed ? 'app-sidebar-collapsed' : ''} ${
        mobile ? 'app-sidebar-mobile' : ''
      }`}
    >
      <div className="app-sidebar-header">
        <BrandMark compact={collapsed && !mobile} />
        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            data-testid="button-close-menu"
            className="app-icon-button app-sidebar-close"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>
      <NavLinks collapsed={collapsed && !mobile} onNavigate={onClose} />
      <div className={`app-sidebar-footer ${collapsed && !mobile ? 'app-sidebar-footer-collapsed' : ''}`}>
        {!collapsed || mobile ? (
          <div className="app-sidebar-note">
            <p>Un espace à préparer</p>
            <span>Vos prochains repères apparaîtront ici, au rythme de votre établissement.</span>
            <Link href="/app/help" onClick={onClose}>
              En savoir plus <ArrowUpRight className="size-3" />
            </Link>
          </div>
        ) : (
          <Link
            href="/app/help"
            onClick={onClose}
            className="app-sidebar-help-icon"
            aria-label="Aide"
            title="Aide"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        )}
        {!collapsed || mobile ? (
          <p className="app-sidebar-phase">Phase 2 · espace de préparation</p>
        ) : null}
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const current = getNavigationItem(location);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <div className="app-layout">
        <div className="hidden md:block">
          <Sidebar
            collapsed={sidebarCollapsed}
          />
        </div>
        {menuOpen ? (
          <div className="app-mobile-dialog" role="dialog" aria-modal="true" aria-label="Menu de navigation">
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setMenuOpen(false)}
              className="app-mobile-overlay"
              data-testid="button-menu-overlay"
            />
            <div className="relative z-10">
              <Sidebar mobile onClose={() => setMenuOpen(false)} />
            </div>
          </div>
        ) : null}
        <div className="app-main-column">
          <header className="app-topbar">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
              data-testid="button-open-menu"
              className="app-icon-button app-mobile-menu-button md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="md:hidden">
              <BrandMark />
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              aria-label={sidebarCollapsed ? 'Ouvrir la barre latérale' : 'Réduire la barre latérale'}
              aria-controls="educpay-desktop-sidebar"
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? 'Ouvrir la barre latérale' : 'Réduire la barre latérale'}
              data-testid="button-toggle-sidebar"
              className="app-icon-button app-sidebar-desktop-toggle"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>
            <div className="app-breadcrumb hidden items-center gap-2 md:flex">
              <span>EducPAY</span>
              <ChevronRight className="size-3.5" />
              <strong>{current.label}</strong>
            </div>
            <div className="app-topbar-actions">
              <label className="app-search">
                <Search className="size-4" aria-hidden="true" />
                <span className="sr-only">Rechercher dans EducPAY</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher un élève, un reçu..."
                  aria-label="Rechercher un élève, un reçu..."
                  data-testid="input-global-search"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Effacer la recherche"
                    className="app-search-clear"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : (
                  <kbd aria-hidden="true">⌘ K</kbd>
                )}
              </label>
              <div className="app-notifications">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((value) => !value)}
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  aria-haspopup="true"
                  data-testid="button-notifications"
                  className="app-icon-button app-notification-button"
                >
                  <Bell className="size-[17px]" strokeWidth={1.8} />
                  <span className="app-notification-dot" aria-hidden="true" />
                </button>
                {notificationsOpen ? (
                  <div className="app-notification-popover" role="dialog" aria-label="Notifications">
                    <div className="app-notification-heading">
                      <div>
                        <p>Notifications</p>
                        <span>Les nouveautés de votre espace</span>
                      </div>
                      <CheckCheck className="size-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="app-notification-empty">
                      <span className="app-notification-empty-icon">
                        <Bell className="size-4" />
                      </span>
                      <p>Tout est calme pour le moment</p>
                      <span>Les alertes de votre établissement apparaîtront ici.</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <span className="app-preparation-badge">Espace de préparation</span>
              <ProfileMenu />
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

function ProfileMenu() {
  const { user, profile, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const metadataName = typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : '';
  const email = user?.email ?? '';
  const displayName = metadataName || email.split('@')[0] || 'Administrateur';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'EP';
  const roleLabel = profile?.role === 'SUPER_ADMIN' ? 'Super administrateur' : profile?.role ?? 'Membre EducPAY';

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
      setOpen(false);
      setLocation('/auth/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-profile" ref={profileRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="app-profile-trigger"
        aria-label={`Ouvrir le profil de ${displayName}`}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="button-profile-menu"
      >
        <span className="app-profile-avatar" aria-hidden="true">{initials}</span>
        <span className="app-profile-trigger-copy">
          <strong>{displayName}</strong>
          <small>{roleLabel}</small>
        </span>
        <ChevronDown className="app-profile-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <div className="app-profile-menu" role="menu" aria-label="Menu du profil">
          <div className="app-profile-menu-header">
            <div className="app-profile-menu-avatar" aria-hidden="true">{initials}</div>
            <div className="app-profile-menu-identity">
              <strong>{displayName}</strong>
              <span>{email}</span>
            </div>
          </div>
          <div className="app-profile-menu-meta">
            <span className="app-profile-role">{roleLabel}</span>
            <span className="app-profile-status">
              <span aria-hidden="true" />
              Session active
            </span>
          </div>
          <div className="app-profile-menu-divider" />
          <button
            type="button"
            onClick={handleSignOut}
            className="app-profile-menu-action"
            role="menuitem"
            disabled={loading}
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>{loading ? 'Déconnexion…' : 'Se déconnecter'}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function UserProfile() {
  const { loading, user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  async function handleSignOut() {
    await signOut();
    setLocation('/auth/login');
  }

  if (loading) return <span>…</span>;
  if (!user) return <Link href="/auth/login" className="auth-inline-link">Se connecter</Link>;

  const email = user.email ?? '';
  const initials = email ? email.charAt(0).toUpperCase() : 'EP';

  return (
    <div className="app-profile">
      <button type="button" onClick={handleSignOut} className="app-icon-button" aria-label="Se déconnecter">
        {initials}
      </button>
    </div>
  );
}