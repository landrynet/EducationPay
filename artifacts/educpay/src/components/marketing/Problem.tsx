import { problems } from '@/data/marketing';

export default function Problem() {
  return <section className="section problem"><div className="container problem-grid"><div className="section-heading"><span className="eyebrow">Le quotidien, autrement</span><h2 className="display">Quand la caisse devient une question de confiance.</h2><p>Les écoles font beaucoup avec peu. Mais les fichiers éparpillés et les carnets de reçus ne devraient pas décider de la qualité de votre suivi.</p></div><div className="problem-list">{problems.map(([number, title, text]) => <article className="problem-item" key={number}><span className="problem-index">{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>;
}