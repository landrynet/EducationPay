import { Check } from 'lucide-react';
import { roles } from '@/data/marketing';
import { useState } from 'react';

type Role = keyof typeof roles;
export default function Benefits() {
  const [role, setRole] = useState<Role>('Direction');
  return <section className="section roles"><div className="container role-grid"><div><span className="eyebrow">Pour chaque rôle</span><h2 className="display">La même vérité, le bon angle.</h2><div className="role-tabs" role="tablist">{(Object.keys(roles) as Role[]).map(name => <button className={`role-tab ${role === name ? 'active' : ''}`} onClick={() => setRole(name)} role="tab" aria-selected={role === name} key={name} data-testid={`button-role-${name.toLowerCase()}`}>{name}</button>)}</div><div className="role-copy"><h3>{roles[role].title}</h3><p>{roles[role].text}</p><ul className="role-points">{roles[role].points.map(point => <li key={point}><span className="check"><Check size={12} /></span>{point}</li>)}</ul></div></div><aside className="role-quote"><span className="role-quote-mark">“</span><blockquote>Une équipe alignée sur les chiffres peut se concentrer sur ce qui compte vraiment : l’école.</blockquote><small>EducPAY <strong>Une gestion plus humaine des frais scolaires.</strong></small></aside></div></section>;
}