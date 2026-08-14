# EducPAY

Landing page marketing React/Vite pour EducPAY, une plateforme de suivi des frais
scolaires destinée aux établissements privés et aux familles.

## Run & Operate

- `pnpm install` — installer les dépendances du monorepo
- `pnpm --filter @workspace/educpay run dev` — lancer EducPAY localement
- `pnpm --filter @workspace/educpay run typecheck` — vérifier les types du frontend
- `PORT=4173 BASE_PATH=/ pnpm --filter @workspace/educpay run build` — construire EducPAY
- Le workflow `artifacts/educpay: web` fournit `PORT=21498` et `BASE_PATH=/` pour l’aperçu.

## Migrations Supabase

Les migrations métier sont versionnées dans `supabase/migrations/`. Pour les
appliquer automatiquement à Supabase :

```bash
pnpm dlx supabase init
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <project-ref>
pnpm dlx supabase migration list
pnpm dlx supabase db push
```

Les migrations `20260812000000`, `20260813000000` et `20260813100000` ont été
appliquées manuellement dans Supabase. Après avoir lié le projet, les marquer
comme déjà appliquées une seule fois :

```bash
pnpm dlx supabase migration repair --status applied 20260812000000
pnpm dlx supabase migration repair --status applied 20260813000000
pnpm dlx supabase migration repair --status applied 20260813100000
```

Le fichier `supabase/manual/phase-3c-enum-repair.sql` est une correction
ponctuelle et ne doit pas être enregistré comme migration versionnée.

Pour une nouvelle modification de schéma :

```bash
pnpm dlx supabase migration new nom-de-la-modification
# modifier le fichier créé dans supabase/migrations/
pnpm dlx supabase db push
```

## Stack

- pnpm workspaces, Node.js, TypeScript
- Frontend : React + Vite
- CSS : Tailwind CSS
- Interface : Lucide React, Tailwind CSS

## Where things live

- `artifacts/educpay/src/components/marketing/` — sections de la landing page
- `artifacts/educpay/src/index.css` — tokens, responsive design et animations
- `artifacts/educpay/src/data/marketing.ts` — contenus répétitifs
- `attached_assets/generated_images/` — visuels éditoriaux de la landing page

## Architecture decisions

- La Phase 1 est une expérience publique ; les fonctionnalités métier utilisent
  Supabase et les migrations versionnées du dossier `supabase/migrations/`.
- Le header est fixe et adopte un état visuel après le début du défilement.
- Les apparitions au scroll utilisent `IntersectionObserver`, avec fallback et respect de `prefers-reduced-motion`.

## Product

- Présenter EducPAY et ses bénéfices aux établissements scolaires privés.
- Expliquer le suivi des encaissements, reçus et paiements partiels.
- Proposer des CTA de contact, une FAQ, des tarifs et des aperçus de produit.

## User preferences

- Préserver la structure et le design existants ; privilégier de petits ajustements ciblés.
- Les animations doivent rester légères, robustes et adaptées aux visiteurs.

## Gotchas

- Le build Vite exige `PORT` et `BASE_PATH`, même pour un lancement manuel.
- Le serveur frontend est servi sur le port fourni par le workflow.
- Les commandes Supabase nécessitent un projet lié ; ne jamais committer un token,
  mot de passe de base de données ou clé `SUPABASE_SERVICE_ROLE_KEY`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Les migrations Supabase sont la source de vérité du schéma métier.
