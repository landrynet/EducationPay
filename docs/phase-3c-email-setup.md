# EducPAY — configuration email Phase 3C

## Ce que le serveur fait

- `APPLICATION_RECEIVED` : confirmation de réception envoyée au Responsable.
- `SUPER_ADMIN_NOTIFICATION` : notification email destinée aux Super Admins.
- `APPLICATION_REJECTED` : motif de refus destiné au Responsable.
- `APPLICATION_RESUBMITTED` : confirmation de resoumission destinée au Responsable.
- `ACTIVATION_SENT` : trace de l’invitation réellement envoyée par Supabase Auth.

Les quatre premiers messages sont enregistrés dans `public.email_events` avec le
statut `PENDING`. Le dépôt ne contient volontairement aucune clé de fournisseur
email et aucun secret n’est envoyé au navigateur. Leur délivrance doit être
branchée sur le service email choisi par le projet (worker/Edge Function ou
SMTP applicatif) et faire passer l’événement à `SENT` ou `FAILED`.

L’email d’activation est différent : le serveur appelle
`auth.admin.inviteUserByEmail`, et Supabase Auth envoie directement son template
d’invitation. Aucune URL d’activation ni aucun mot de passe n’est stocké dans
`email_events`.

## Configuration Supabase à faire

Dans Supabase :

1. Appliquer les migrations dans `supabase/migrations/` dans l’ordre.
2. Dans **Authentication → URL Configuration**, définir le Site URL.
3. Ajouter les URLs de redirection :
   - `https://<domaine>/auth/activate`
   - `https://<domaine>/auth/reset-password`
   - l’URL de prévisualisation utilisée pendant les tests.
4. Dans **Authentication → Email Templates**, personnaliser au minimum
   l’invitation et la récupération de mot de passe avec le nom EducPAY.
5. Configurer un SMTP de production dans **Authentication → SMTP Settings**.
   Sans SMTP personnalisé, Supabase limite l’envoi des emails Auth.
6. Régler l’expiration des liens Auth à 48 heures si cette option est disponible
   dans le projet, pour l’aligner avec `activation_expires_at`.

Dans Replit :

- `VITE_SUPABASE_URL` : URL publique du projet Supabase — frontend.
- `VITE_SUPABASE_ANON_KEY` : clé publique Supabase — frontend.
- `SUPABASE_URL` : URL du projet — serveur.
- `SUPABASE_SERVICE_ROLE_KEY` : clé privée Supabase — serveur uniquement.
- `PUBLIC_APP_URL` : URL absolue publique utilisée pour les redirections Auth.

Ne jamais mettre `SUPABASE_SERVICE_ROLE_KEY` dans une variable `VITE_*`.