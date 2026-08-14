# EducPAY

EducPAY est une landing page publique destinée aux établissements scolaires
privés qui veulent clarifier la présentation du suivi des frais scolaires, des
versements en espèces, des paiements partiels et des reçus.

Cette version contient uniquement la Phase 1 : une landing page responsive,
accessible et sans authentification ni base métier.

## Structure

```text
artifacts/
└── educpay/
    ├── src/components/marketing/  # Sections de la landing page
    ├── src/data/                  # Contenus marketing structurés
    ├── src/index.css              # Tokens, responsive et animations
    └── public/                    # Favicon et robots.txt

attached_assets/generated_images/  # Visuels éditoriaux de la page
```

## Stack

- React, TypeScript et Vite
- Tailwind CSS
- Lucide React
- pnpm workspaces

## Lancer le projet

```bash
pnpm install
pnpm --filter @workspace/educpay run dev
```

Vérifications disponibles :

```bash
pnpm --filter @workspace/educpay run typecheck
PORT=4173 BASE_PATH=/ pnpm --filter @workspace/educpay run build
```

Le workflow Replit fournit automatiquement `PORT=21498` et `BASE_PATH=/`
pour l’aperçu.

## Phase actuelle

- Header, navigation publique et menu mobile
- Hero et présentation d’EducPAY
- Sections problèmes, solution, fonctionnalités et bénéfices
- Aperçus marketing, FAQ, tarifs, CTA et footer
- Responsive design, animations légères, états hover et focus

Les Phases 2, 3 et 4 ne sont pas présentes dans cette version. Les routes
privées, l’authentification, les rôles, les dashboards, les établissements,
les élèves, les paiements et les migrations métier seront ajoutés uniquement
dans leurs phases dédiées.