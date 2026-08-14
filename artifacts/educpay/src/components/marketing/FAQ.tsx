import { ArrowRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { faqs } from '@/data/marketing';
import { Anchor } from './Header';

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return <section className="section faq" id="faq"><div className="container faq-layout"><div className="faq-intro"><span className="eyebrow">Questions justes</span><h2 className="display">Vous voulez savoir.</h2><p>Voici les réponses aux questions que les équipes nous posent le plus souvent.</p><Anchor href="#contact"><span className="button button-link" style={{ marginTop: 22 }}>Une autre question ? <ArrowRight size={15} /></span></Anchor></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question}><button className="faq-question" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} data-testid={`button-faq-${index}`}><span>{question}</span><Plus size={18} /></button>{openFaq === index && <div className="faq-answer">{answer}</div>}</div>)}</div></div></section>;
}