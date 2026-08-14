import { ArrowRight, Menu, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

function Anchor({ href, children, onClick, testId }: { href: string; children: ReactNode; onClick?: () => void; testId?: string }) {
  return <a href={href} onClick={onClick} data-testid={testId ?? `link-${href.slice(1)}`}>{children}</a>;
}

export function Logo() {
  return <a className="brand" href="#accueil" data-testid="link-brand"><span className="brand-mark" aria-hidden="true">e</span><span>EducPAY</span></a>;
}

export { Anchor };

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = () => setMobileOpen(false);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 12);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  return <>
    <header className={`topbar ${scrolled ? 'scrolled' : ''}`} id="accueil">
      <div className="nav-wrap">
        <Logo />
        <nav className="nav-links" aria-label="Navigation principale">
          <Anchor href="#fonctionnalites">Fonctionnalités</Anchor><Anchor href="#solution">Solution</Anchor><Anchor href="#tarifs">Tarifs</Anchor><Anchor href="#faq">FAQ</Anchor>
        </nav>
         <div className="nav-actions"><a href="/auth/login" className="login-link">Entrer dans l’espace</a><Anchor href="#contact"><span className="button button-dark">Demander une démo <ArrowRight size={15} /></span></Anchor></div>
        <button className="mobile-toggle" onClick={() => setMobileOpen(value => !value)} aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} data-testid="button-mobile-menu">{mobileOpen ? <X /> : <Menu />}</button>
      </div>
    </header>
    <div className={`mobile-panel ${mobileOpen ? 'open' : ''}`}>
       <Anchor href="#fonctionnalites" onClick={close}>Fonctionnalités</Anchor><Anchor href="#solution" onClick={close}>Solution</Anchor><Anchor href="#tarifs" onClick={close}>Tarifs</Anchor><Anchor href="#faq" onClick={close}><span>FAQ</span></Anchor>
       <a href="/auth/login" onClick={close} className="button button-link">Entrer dans l’espace <ArrowRight size={15} /></a><Anchor href="#contact" onClick={close}><span className="button button-dark">Demander une démo <ArrowRight size={15} /></span></Anchor>
    </div>
  </>;
}