import { steps } from '@/data/marketing';

export default function HowItWorks() {
  return <section className="workflow" id="comment-ca-marche"><div className="container"><div className="workflow-header"><div><span className="eyebrow">Le rythme EducPAY</span><h2 className="display">Une méthode qui suit la vraie vie.</h2></div><p className="workflow-note">De la première configuration au récapitulatif mensuel, chaque étape reste lisible.</p></div><div className="steps">{steps.map(([number, title, text]) => <article className="step" key={number}><div className="step-number">{number}</div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}