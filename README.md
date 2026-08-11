# SERINDUS – Remontées terrain QSE

Application web installable (PWA) inspirée de la fiche progrès SASI.

## 1. Tester immédiatement

Ouvrir `index.html` avec un serveur local. Le mode `demo` enregistre les remontées
uniquement dans le navigateur utilisé. Le code administrateur de démonstration
est `QSE2026`.

## 2. Publier sur GitHub Pages

1. Créer un dépôt GitHub public nommé `remontees-terrain`.
2. Déposer tous les fichiers de ce dossier à la racine du dépôt.
3. Ouvrir **Settings > Pages**.
4. Dans **Build and deployment**, choisir **Deploy from a branch**.
5. Sélectionner la branche `main` et le dossier `/ (root)`.
6. Enregistrer et attendre l’apparition du lien GitHub Pages.

## 3. Créer le stockage Supabase

1. Créer un projet sur https://supabase.com.
2. Ouvrir **SQL Editor**, créer une requête et coller `supabase.sql`.
3. Exécuter la requête.
4. Dans **Project Settings > API**, copier :
   - l’URL du projet ;
   - la clé publique `anon`.
5. Modifier `config.js` :

```js
mode: "supabase",
supabaseUrl: "https://VOTRE-PROJET.supabase.co",
supabaseAnonKey: "VOTRE_CLE_ANON"
```

La clé `anon` est prévue pour le navigateur. Ne jamais mettre la clé
`service_role` dans ce projet.

## 4. Sécurité avant diffusion

Le formulaire peut déposer des remontées, mais la lecture des remontées reste
bloquée par Supabase. L’espace QSE en mode démonstration ne doit pas être utilisé
en production : un simple code placé dans `config.js` n’est pas un vrai contrôle
d’accès.

Avant la diffusion générale, il faut ajouter l’authentification Supabase pour les
administrateurs, puis une règle autorisant uniquement ces comptes à consulter et
modifier les remontées.

## 5. Installer sur un smartphone

- Android/Chrome : menu ⋮ > **Ajouter à l’écran d’accueil**.
- iPhone/Safari : bouton Partager > **Sur l’écran d’accueil**.

## Contenu

- `index.html` : formulaire collaborateur.
- `admin.html` : tableau de suivi QSE.
- `config.js` : mode et paramètres.
- `supabase.sql` : base de données et stockage photo.
- `manifest.webmanifest` et `sw.js` : installation PWA et cache.
