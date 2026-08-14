import { features } from '@/data/marketing';

export default function Solution() {
  return <section className="section solution" id="solution"><div className="container solution-layout"><div className="solution-lead"><span className="eyebrow">Une seule source</span><h2 className="display">Moins de recherche. Plus de maîtrise.</h2></div><div className="feature-grid" id="fonctionnalites">{features.map(({ icon: Icon, title, text }) => <article className="feature-card" key={title}><div className="icon-box"><Icon size={20} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}