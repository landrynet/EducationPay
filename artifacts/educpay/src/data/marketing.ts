import { BarChart3, FileCheck2, ReceiptText, WalletCards, type LucideIcon } from 'lucide-react';

export const features: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: ReceiptText, title: 'Suivi des frais', text: 'Une vue nette des frais attendus, reçus et restant dus, classe par classe et élève par élève.' },
  { icon: WalletCards, title: 'Paiements en espèces', text: 'Enregistrez chaque versement au guichet, même partiel, avec une trace simple et fiable.' },
  { icon: FileCheck2, title: 'Reçus clairs', text: 'Chaque paiement est associé à un reçu lisible, prêt à être partagé avec les familles.' },
  { icon: BarChart3, title: 'Pilotage serein', text: 'Les bons indicateurs au bon moment pour décider sans attendre la fin du mois.' },
];

export const problems = [
  ['01', 'Des cahiers qui se croisent', 'Quand plusieurs personnes suivent les paiements, les informations se dispersent et les erreurs deviennent difficiles à retrouver.'],
  ['02', 'Des familles qui manquent de visibilité', 'Un solde approximatif crée des allers-retours inutiles et fragilise la relation de confiance.'],
  ['03', 'Des clôtures qui prennent trop de temps', 'Reconstituer les encaissements et les restes à payer ne devrait pas être un exercice de détective.'],
] as const;

export const steps = [
  ['01', 'Créez votre établissement', 'Renseignez les classes, les élèves et les frais de l’année scolaire.'],
  ['02', 'Enregistrez les versements', 'À chaque passage, notez le montant reçu et générez le reçu correspondant.'],
  ['03', 'Suivez les soldes', 'Direction, comptabilité et familles partagent une même information à jour.'],
  ['04', 'Décidez avec confiance', 'Les récapitulatifs donnent une lecture simple de la situation de l’école.'],
] as const;

export const roles = {
  Direction: { title: 'Une direction qui voit loin.', text: 'Vous retrouvez en quelques secondes la réalité financière de votre établissement, sans demander trois fichiers différents.', points: ['Une vision consolidée des encaissements', 'Des décisions basées sur des données à jour', 'Un suivi plus serein des engagements'] },
  Comptabilité: { title: 'Une comptabilité qui respire.', text: 'La caisse et les écritures de frais suivent un chemin lisible, de l’encaissement au récapitulatif.', points: ['Des reçus rattachés à chaque versement', 'Les paiements partiels suivis sans calcul manuel', 'Une préparation facilitée des clôtures'] },
  Parents: { title: 'Des familles mieux informées.', text: 'Les familles comprennent ce qui a été réglé, ce qui reste à régler et disposent d’un justificatif clair.', points: ['Un solde compréhensible', 'Moins de relances et d’allers-retours', 'Une relation école-famille plus transparente'] },
} as const;

export const faqs = [
  ['EducPAY est-il un service de paiement en ligne ?', 'Non. La Phase 1 accompagne la gestion des frais et des paiements reçus par l’établissement, notamment en espèces. Un futur espace parent pourra évoluer vers de nouveaux usages, mais aucun paiement en ligne n’est proposé aujourd’hui.'],
  ['À qui s’adresse EducPAY ?', 'Aux établissements privés qui veulent fiabiliser leur suivi : directions, équipes comptables, caisses et familles peuvent enfin s’appuyer sur la même vue.'],
  ['Puis-je gérer les paiements partiels ?', 'Oui. EducPAY est pensé pour enregistrer chaque versement, quel que soit son montant, et recalculer clairement le solde restant.'],
  ['Les tarifs sont-ils déjà définitifs ?', 'Les formules seront proposées par établissement, au mois ou à l’année. Les montants sont encore en cours de finalisation : demandez une présentation pour être informé en priorité.'],
] as const;

export const pricingPlans = [
  { name: 'Essentiel', description: 'Pour démarrer avec une base saine.', items: ['Suivi des frais', 'Paiements en espèces', 'Reçus clairs'] },
  { name: 'Équipe', description: 'Pour les établissements qui grandissent.', items: ['Tout Essentiel', 'Accès direction & comptabilité', 'Récapitulatifs avancés'] },
  { name: 'Sur mesure', description: 'Pour une organisation multi-sites.', items: ['Tout Équipe', 'Accompagnement dédié', 'Échangeons sur vos besoins'] },
] as const;