import { BarChart3, Check, CircleDollarSign, FileText, ReceiptText, ShieldCheck, Users } from 'lucide-react';

export default function DashboardPreview() {
  const bars = [54, 73, 49, 87, 44, 65, 93, 58, 74, 61, 81, 70];
  return <div className="dashboard-frame" aria-label="Aperçu fictif de l'espace EducPAY">
    <div className="dashboard">
      <aside className="dash-side"><div className="dash-logo"><i /> EducPAY</div><div className="dash-nav">
        <span><BarChart3 /> Vue d’ensemble</span><span><Users /> Élèves</span><span><CircleDollarSign /> Paiements</span><span><ReceiptText /> Reçus</span><span><FileText /> Rapports</span><span><ShieldCheck /> Paramètres</span>
      </div></aside>
      <div className="dash-main"><div className="dash-top"><h3>Vue d’ensemble</h3><div className="dash-search">Rechercher un élève, un reçu…</div></div>
        <div className="dash-grid"><div className="dash-stat"><small>Élèves suivis</small><b>248</b></div><div className="dash-stat"><small>Encaissé ce mois</small><b className="blue">18 420 €</b></div><div className="dash-stat"><small>À recevoir</small><b className="gold">7 860 €</b></div>
          <div className="chart-card"><div className="chart-head">Encaissements <span>Année scolaire 2025–26 · Mensuel</span></div><div className="bars">{bars.map((height, i) => <div className="bar-pair" key={i}><i className="bar" style={{ height: `${height}%` }} /><i className="bar light" style={{ height: `${Math.max(25, height - 20)}%` }} /></div>)}</div><div className="bar-labels">{['Sep','Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû'].map(month => <span key={month}>{month}</span>)}</div></div>
          <div className="dash-breakdown"><h4>Répartition des soldes</h4><div className="progress-line"><div><span>Réglé</span><b>64%</b></div><div className="track"><i style={{ width: '64%' }} /></div></div><div className="progress-line"><div><span>Partiel</span><b>21%</b></div><div className="track"><i className="yellow" style={{ width: '21%' }} /></div></div><div className="progress-line"><div><span>À relancer</span><b>15%</b></div><div className="track"><i style={{ width: '15%', background: 'var(--coral)' }} /></div></div></div>
        </div>
      </div>
    </div>
    <div className="float-note"><span className="float-check"><Check size={14} /></span><span><b>Reçu enregistré</b><small>Pour Aïcha M. · il y a 2 min</small></span></div>
  </div>;
}