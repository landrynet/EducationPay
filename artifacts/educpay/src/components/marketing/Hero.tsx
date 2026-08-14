import { ArrowRight } from 'lucide-react';
import schoolTeam from '@assets/generated_images/educpay-school-team.jpg';
import DashboardPreview from './DashboardPreview';
import { Anchor } from './Header';

export default function Hero() {
  return <section className="hero" aria-labelledby="hero-title"><div className="container hero-grid">
    <div className="hero-copy"><span className="eyebrow">La clarté au service de l’école</span><h1 className="display" id="hero-title">Les frais scolaires, <em>sans zone grise.</em></h1><p>EducPAY aide les établissements privés à suivre les frais, les paiements en espèces et les soldes dans un même espace — simple, partagé, fiable.</p>
      <div className="hero-buttons"><Anchor href="#contact"><span className="button button-primary">Parler de votre établissement <ArrowRight size={16} /></span></Anchor><Anchor href="#solution"><span className="button button-link">Découvrir EducPAY <ArrowRight size={16} /></span></Anchor></div>
      <div className="trust-row"><div className="avatar-stack"><i className="avatar">SD</i><i className="avatar">KM</i><i className="avatar">AB</i><i className="avatar">+</i></div><span>Pour les équipes qui veulent <strong>une information de confiance.</strong></span></div>
    </div>
    <div className="hero-visual"><DashboardPreview /><figure className="hero-image"><img src={schoolTeam} alt="Une direction et une équipe comptable relisent les chiffres de leur établissement" /><figcaption>Une équipe, une même lecture</figcaption></figure></div>
  </div></section>;
}