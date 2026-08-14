import Header from './Header';
import Hero from './Hero';
import Problem from './Problem';
import Solution from './Solution';
import ProductPreview from './ProductPreview';
import HowItWorks from './HowItWorks';
import Benefits from './Benefits';
import ParentPortal from './ParentPortal';
import ReceiptBand from './ReceiptBand';
import Pricing from './Pricing';
import FAQ from './FAQ';
import CTA from './CTA';
import Footer from './Footer';
import ScrollReveal from './ScrollReveal';
import schoolTeam from '@assets/generated_images/educpay-school-team.jpg';

export default function MarketingPage() {
  return <div className="site-shell"><Header /><main><Hero /><div className="signal-strip"><div className="container signal-inner"><p>Une base saine pour gérer les moments qui comptent.</p><div className="signal-list"><span>Direction</span><span>Comptabilité</span><span>Familles</span></div></div></div><ScrollReveal><Problem /></ScrollReveal><ScrollReveal><section className="section"><div className="container image-story"><figure className="story-photo"><img src={schoolTeam} alt="Une directrice et un comptable collaborent autour du suivi financier de l'école" /><figcaption className="story-caption"><strong>La preuve commence par l’équipe.</strong>Quand chacun lit la même information, les décisions deviennent plus simples.</figcaption></figure><div className="story-copy"><span className="eyebrow">Une équipe alignée</span><h2 className="display">La gestion financière ne devrait pas rester dans la tête d’une seule personne.</h2><p>EducPAY transforme les habitudes de suivi en une base commune : une direction qui sait, une comptabilité qui retrouve, une famille qui comprend.</p><ul className="story-points"><li><span className="check">✓</span>Une continuité entre caisse, reçus et récapitulatifs</li><li><span className="check">✓</span>Des échanges fondés sur des faits, pas sur des suppositions</li></ul></div></div></section></ScrollReveal><ScrollReveal><Solution /></ScrollReveal><ScrollReveal><ReceiptBand /></ScrollReveal><ScrollReveal><ProductPreview /></ScrollReveal><ScrollReveal><HowItWorks /></ScrollReveal><ScrollReveal><Benefits /></ScrollReveal><ScrollReveal><ParentPortal /></ScrollReveal><ScrollReveal><Pricing /></ScrollReveal><ScrollReveal><FAQ /></ScrollReveal><ScrollReveal><CTA /></ScrollReveal></main><Footer /></div>;
}