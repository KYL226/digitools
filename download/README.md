# DigiTools

> 26 outils web haut de gamme pour développeurs, rédacteurs et créateurs — rapides, privés, bilingues (EN/FR), installables en PWA et fonctionnels hors ligne.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0ff8?logo=pwa)](https://web.dev/progressive-web-apps/)
[![Bun](https://img.shields.io/badge/Runtime-Bun-f9f1e1?logo=bun)](https://bun.sh/)

---

## 📋 Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Les 26 outils](#les-26-outils)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Architecture](#architecture)
- [PWA & mode hors-ligne](#pwa--mode-hors-ligne)
- [Internationalisation](#internationalisation)
- [Mini-services](#mini-services)
- [Déploiement](#déploiement)
- [Scripts utilitaires](#scripts-utilitaires)
- [Confidentialité](#confidentialité)
- [Captures d'écran](#captures-dcran)

---

## Présentation

**DigiTools** est une collection de 26 utilitaires navigateur regroupés dans une seule application web progressive (PWA). Conçue pour les développeurs, rédacteurs et créateurs de contenu, elle se veut :

- **Rapide** — chargement à la demande (lazy-loading), traitement 100 % côté client
- **Privée** — vos données ne quittent jamais votre navigateur, à l'exception du téléchargeur vidéo qui doit contacter les plateformes source
- **Bilingue** — interface complète en anglais et en français
- **Installable** — ajoutez-la à votre écran d'accueil ou à votre bureau, fonctionne hors ligne
- **Thème clair/sombre** — suit votre préférence système, modifiable à la volée

L'application tourne sur Next.js 16 (App Router) avec React 19, Tailwind CSS 4 et shadcn/ui. Le traitement lourd (conversion vidéo, audio, image) s'appuie sur FFmpeg compilé en WebAssembly et exécuté directement dans le navigateur.

---

## Fonctionnalités

- 🧰 **26 outils** répartis en 6 catégories (développeur, encodage, texte, image, design, média)
- 🔍 **Recherche globale** bilingue (EN+FR) sur le nom, la description, les alias et les mots-clés de chaque outil
- ⌨️ **Raccourci `/`** pour focaliser la recherche instantanément
- 🌗 **Thème clair / sombre / système** persistant
- 🌐 **Bilingue EN/FR** avec détection automatique de la langue du navigateur
- 📱 **PWA installable** — icône sur l'écran d'accueil, lancement en mode standalone
- ✈️ **Mode hors-ligne** — service worker avec stratégies de cache intelligentes
- 🔖 **Raccourcis d'app** — accès direct à 4 outils depuis l'icône de l'app (JSON, QR Code, Téléchargeur, Mot de passe)
- 🍞 **Notifications toast** (sonner) pour le retour d'action
- 🗂️ **Routage par hash** (`/#/tools/<slug>`) — pas de rechargement de page, partage d'URL direct vers un outil
- 🎬 **FFmpeg WASM** — conversion/compression vidéo et audio sans serveur
- 🔐 **Aucune collecte de données** — pas d'analytics, pas de trackers, pas de compte requis

---

## Les 26 outils

Tous les outils sont traités côté client (sauf le téléchargeur vidéo). Les composants sont lazy-loadés : seuls les outils ouverts téléchargent leur code et leurs dépendances.

### 🧑‍💻 Outils développeur (5)

| Slug | Nom (FR) | Description |
|---|---|---|
| `json-formatter` | Formateur et Validateur JSON | Indente, valide et formate du JSON |
| `code-formatter` | Formateur de Code | Formate du code source (multi-langages) |
| `html-formatter` | Formateur HTML | Indente et nettoyage du HTML |
| `css-formatter` | Formateur CSS | Indente et organise le CSS |
| `javascript-formatter` | Formateur JavaScript | Indente et reformate du JS |

### 🔐 Encodage & générateurs (5)

| Slug | Nom (FR) | Description |
|---|---|---|
| `base64` | Encodeur / Décodeur Base64 | Conversion Base64 texte ↔ chaîne |
| `url-encoder` | Encodeur / Décodeur d'URL | Encodage/décodage de composants URL |
| `uuid-generator` | Générateur d'UUID | Génération d'identifiants uniques (v4) |
| `password-generator` | Générateur de Mot de Passe | Mots de passe sécurisés personnalisables |
| `qr-code` | Générateur de QR Code | QR codes à partir de texte ou URL |

### 📝 Outils texte (5)

| Slug | Nom (FR) | Description |
|---|---|---|
| `markdown-previewer` | Aperçu Markdown | Rendu Markdown en direct (GFM) |
| `regex-tester` | Testeur d'Expressions Régulières | Test et mise en évidence de regex |
| `text-diff` | Comparateur de Différences Texte | Diff visuel entre deux textes |
| `word-counter` | Compteur de Mots & Caractères | Statistiques sur un texte |
| `case-converter` | Convertisseur de Casse | UPPERCASE, lowercase, Title, camelCase… |

### 🖼️ Outils image (5)

| Slug | Nom (FR) | Description |
|---|---|---|
| `image-compressor` | Compresseur d'Images | Réduit la taille (qualité réglable) |
| `image-resizer` | Redimensionneur d'Images | Change les dimensions (Canvas) |
| `image-cropper` | Découpeur d'Images | Recadrage interactif |
| `image-converter` | Convertisseur de Format d'Image | PNG ↔ JPG ↔ WebP ↔ … |
| `svg-optimizer` | Optimiseur SVG | Minifie et nettoie le SVG |

### 🎨 Design & utilitaires (2)

| Slug | Nom (FR) | Description |
|---|---|---|
| `color-converter` | Convertisseur & Sélecteur de Couleur | HEX ↔ RGB ↔ HSL |
| `timestamp-converter` | Convertisseur d'Horodatage | Unix ↔ date lisible |

### 🎬 Outils média (4)

| Slug | Nom (FR) | Description | Hors-ligne ? |
|---|---|---|---|
| `video-converter` | Convertisseur de Format Vidéo | MP4 ↔ WebM ↔ … via FFmpeg WASM | ✅ après 1er lancement |
| `video-compressor` | Compresseur Vidéo | Réduit la taille vidéo (FFmpeg WASM) | ✅ après 1er lancement |
| `audio-converter` | Convertisseur Audio | MP3 ↔ WAV ↔ … (FFmpeg WASM) | ✅ après 1er lancement |
| `video-downloader` | Téléchargeur de Vidéos | YouTube, TikTok, Instagram, Facebook… | ❌ connexion requise |

> ℹ️ **Note sur le mode hors-ligne des outils média** : FFmpeg WASM pèse ~30 Mo. Au premier lancement, le navigateur télécharge ces fichiers ; ils sont ensuite mis en cache par le navigateur et disponibles hors-ligne. Le téléchargeur vidéo, lui, dépend d'un mini-service backend et des plateformes source — il ne fonctionnera jamais hors-ligne.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | **Next.js 16** (App Router, `output: "standalone"`) |
| UI | **React 19**, **Tailwind CSS 4**, **shadcn/ui** (Radix UI) |
| Langage | **TypeScript 5** |
| État | **Zustand** (store global), **TanStack Query** (cache serveur) |
| Thème | **next-themes** (clair / sombre / système) |
| i18n | Contexte React personnalisé (EN/FR) avec fallback |
| Icônes | **lucide-react** |
| Notifications | **sonner** |
| Média | **@ffmpeg/ffmpeg** (WASM), **sharp** (côté build) |
| Téléchargement | Mini-service Node + **yt-dlp** |
| Validation | **zod** + **react-hook-form** |
| Markdown | **react-markdown**, **remark-gfm**, **mdx-editor** |
| Base de données | **Prisma** + SQLite (boilerplate, non utilisée par les outils) |
| Runtime | **Bun** (dev, scripts) et **Node** (prod via standalone) |
| Proxy inverse | **Caddy v2** (port 81) |

---

## Démarrage rapide

### Prérequis

- **Bun** ≥ 1.0 ([installation](https://bun.sh/docs/installation))
- **Node.js** ≥ 20 (pour le build standalone en production)
- **yt-dlp** sur le `PATH` (uniquement pour le téléchargeur vidéo) — typiquement `pip install yt-dlp`
- **Caddy** ≥ 2 (pour le déploiement complet avec proxy inverse)

### Installation

```bash
# 1. Cloner le dépôt
git clone <votre-repo> digitools
cd digitools

# 2. Installer les dépendances (Bun)
bun install

# 3. Installer aussi le mini-service téléchargeur vidéo
cd mini-services/video-downloader
bun install
cd ../..
```

### Lancement en développement

L'application se compose de trois processus qui doivent tourner ensemble :

```bash
# Terminal 1 — application Next.js (port 3000)
bun run dev

# Terminal 2 — mini-service téléchargeur vidéo (port 3004)
cd mini-services/video-downloader
bun run dev

# Terminal 3 — proxy inverse Caddy (port 81)
caddy run
```

Puis ouvrir **http://localhost:81** dans le navigateur.

> 💡 Caddy est nécessaire car il route dynamiquement les requêtes `?XTransformPort=3004` vers le mini-service. Sans Caddy, l'app Next.js fonctionne seule sur le port 3000, mais le téléchargeur vidéo ne marchera pas.

### Build et lancement en production

```bash
# Build (génère .next/standalone + copie static et public)
bun run build

# Lancer le serveur standalone
bun run start
```

Le script `build` assemble automatiquement le bundle standalone :
- `next build`
- copie `.next/static` dans `.next/standalone/.next/`
- copie `public/` dans `.next/standalone/`

---

## Architecture

```
                    ┌──────────────────────────┐
                    │   Navigateur (client)    │
                    │   - Next.js RSC + CSR    │
                    │   - Service Worker (SW)  │
                    │   - FFmpeg WASM (~30 Mo) │
                    │   - localStorage i18n    │
                    └────────────┬─────────────┘
                                 │ HTTP (:81)
                                 ▼
                    ┌──────────────────────────┐
                    │     Caddy (port 81)       │
                    │   Reverse proxy + TLS     │
                    └────┬──────────────┬───────┘
                         │              │
              pas de     │              │ ?XTransformPort=3004
              XTransform │              │
                         ▼              ▼
              ┌──────────────┐  ┌──────────────────┐
              │  Next.js      │  │  video-downloader │
              │  (port 3000)  │  │  (port 3004)      │
              │  App shell    │  │  Node + yt-dlp    │
              │  + 26 outils  │  │  /api/info        │
              │  + PWA        │  │  /api/proxy       │
              └──────────────┘  └──────────────────┘
```

**Routage Caddy** (voir `Caddyfile`) :
- Requête sans `?XTransformPort` → proxy vers `localhost:3000` (Next.js)
- Requête avec `?XTransformPort=<port>` → proxy vers `localhost:<port>` (mini-service)

Ce mécanisme permet au frontend d'atteindre n'importe quel mini-service en passant simplement son port dans l'URL — pas de configuration Caddy par service.

### Arborescence du projet

```
.
├── src/
│   ├── app/                      # App Router (layout.tsx, page.tsx, api/)
│   ├── components/
│   │   ├── layout/               # AppShell, Header, theme, language switcher
│   │   ├── home/                 # Page d'accueil + recherche
│   │   └── tools/                # 26 composants d'outils (lazy-loaded)
│   ├── data/tools.tsx            # Registre TOOLS[] (slug, catégorie, icône)
│   ├── lib/i18n/                 # Contexte i18n personnalisé
│   ├── messages/                 # en.json + fr.json (~30 Ko chacun)
│   └── store/                    # Zustand stores (route, recherche, catégorie)
├── public/
│   ├── manifest.webmanifest      # Manifest PWA
│   ├── sw.js                     # Service worker
│   ├── logo-digi.svg             # Logo SVG
│   ├── icon-*.png                # Icônes PWA (192, 512, maskable, apple-touch)
│   ├── favicon-*.png             # Favicons 16/32
│   ├── og-image.png              # Aperçu réseaux sociaux (1200×630)
│   └── ffmpeg/                   # FFmpeg WASM (core.js + core.wasm + worker)
├── mini-services/
│   └── video-downloader/         # Backend yt-dlp (port 3004)
├── scripts/                      # Utilitaires Python (voir ci-dessous)
├── prisma/                       # Schema Prisma (boilerplate)
├── Caddyfile                     # Proxy inverse
└── package.json                  # Dépendances + scripts Bun
```

---

## PWA & mode hors-ligne

DigiTools est une **PWA installable** validée sur les 11 critères Lighthouse.

### Manifest

Le fichier `public/manifest.webmanifest` déclare :

- `name` : "DigiTools — Premium Browser Utility Tools"
- `short_name` : "DigiTools"
- `display` : `standalone` (lance l'app sans barre de navigateur)
- `theme_color` : `#6366f1` (indigo)
- `background_color` : `#0a0a0a`
- **6 icônes** : 192, 512, maskable-192, maskable-512, favicon-16, favicon-32
- **4 raccourcis d'app** : JSON Formatter, QR Code, Téléchargeur Vidéos, Générateur de Mot de Passe
- **1 capture d'écran** : og-image.png (1200×630)

### Service Worker

Le fichier `public/sw.js` (cache version `digitools-v1`) applique des stratégies de cache différenciées :

| Type de ressource | Stratégie |
|---|---|
| Shell HTML / navigations | **Network-first** avec fallback sur le shell caché |
| Assets statiques (`/_next/static/`, polices, icônes) | **Stale-while-revalidate** |
| API + mini-services (`?XTransformPort`, `/api/`) | **Network-only** (jamais en cache) |
| FFmpeg WASM (32 Mo) | Network-only (laissé au cache HTTP du navigateur) |

Le service worker :
- Pré-cache le shell à l'installation (`/`, manifest, logos, icônes)
- Nettoie les anciennes versions au `activate`
- Vérifie les mises à jour toutes les heures
- Contrôle immédiat grâce à `skipWaiting()` + `clients.claim()`

### Installation

- **Chrome / Edge** : ouvrir l'app → cliquer sur l'icône ⊕ Installer dans la barre d'URL → Menu → "Installer DigiTools"
- **iOS Safari** : Partager → "Sur l'écran d'accueil"
- **Android Chrome** : menu ⋮ → "Installer l'application"

### Que fonctionne hors-ligne ?

| Type d'outil | Hors-ligne ? |
|---|---|
| Texte / Développeur / Design | ✅ Oui |
| Image (Canvas) | ✅ Oui |
| Conversion vidéo/audio (FFmpeg) | ⚠️ Après le 1er lancement (téléchargement WASM) |
| Téléchargeur vidéo | ❌ Jamais (besoin de joindre les plateformes) |

---

## Internationalisation

L'app est **bilingue anglais / français** via un contexte React personnalisé (`src/lib/i18n/i18n-context.tsx`) — pas `next-intl` malgré sa présence dans `package.json`.

- **Messages** : `src/messages/en.json` (28 Ko) et `src/messages/fr.json` (32 Ko), importés statiquement
- **Détection** : démarre en `en` (pour éviter les erreurs d'hydration SSR), puis après montage lit `localStorage["toolforge-locale"]` ou détecte `navigator.languages` (FR si une langue française est présente, sinon EN)
- **Persistance** : `localStorage` + cookie `toolforge-locale` (1 an, `SameSite=Lax`) + attribut `<html lang>`
- **Fallback** : si une clé manque dans la langue active, on retombe sur l'anglais
- **Sélecteur** : composant `LanguageSwitcher` dans le header

> ℹ️ La clé de stockage `toolforge-locale` a été conservée intentionnellement lors du renommage ToolForge → DigiTools, pour que les utilisateurs existants gardent leur préférence de langue.

---

## Mini-services

### `video-downloader` (port 3004)

Backend du téléchargeur vidéo. **Pure Node.js** (module `http` natif, pas de framework).

**Endpoints :**

| Route | Méthode | Rôle |
|---|---|---|
| `/api/info?url=<video>` | GET | Extrait les métadonnées via `yt-dlp --dump-json` (titre, durée, formats, URL directe). Mode "direct" pour les URLs `.mp4`/`.webm`/`.mp3` brutes (skip yt-dlp). |
| `/api/proxy?url=<video>` | GET | Stream la vidéo depuis la source vers le navigateur (contourne CORS, supporte les `Range`). |
| `/api/health` | GET | `{ ok: true, service: "video-downloader", version: "1.0.0" }` |

**Plateformes supportées** (liste blanche validée côté serveur) :
YouTube, TikTok, Instagram, Facebook, Vimeo, Twitter/X, Dailymotion, Twitch, SoundCloud, Pinterest, Reddit, Streamable.

**Philosophie** : la vidéo est streamée **directement de la source vers le navigateur**. Le backend ne fait qu'extraire l'URL directe — **il ne stocke jamais la vidéo**.

**Sécurité** :
- Liste blanche stricte des domaines source
- Limite anti-abus de 16 Ko sur le corps des requêtes
- Plafond stdout de 100 Mo pour yt-dlp (anti-déni de service)

**Démarrage** :
```bash
cd mini-services/video-downloader
bun run dev   # écoute sur http://localhost:3004
```

> ⚠️ Nécessite `yt-dlp` sur le `PATH` (typiquement `pip install yt-dlp`). Le service cherche l'exécutable dans `/home/z/.venv/bin/yt-dlp` par défaut — ajustez le chemin dans `server.ts` si besoin.

---

## Déploiement

Le déploiement est **bare-metal** (pas de Docker, pas de Vercel). Trois processus + Caddy :

```bash
# 1. Build et lancer Next.js (port 3000)
bun run build
bun run start &

# 2. Lancer le mini-service (port 3004)
cd mini-services/video-downloader && bun run dev &

# 3. Lancer Caddy (port 81, public)
caddy run
```

**Ports utilisés :**

| Port | Service | Visibilité |
|---|---|---|
| 81 | Caddy (proxy inverse) | Public |
| 3000 | Next.js (app) | Localhost |
| 3004 | video-downloader (mini-service) | Localhost |

Caddy est le seul point d'entrée public ; les autres ports ne doivent pas être exposés directement. Pour la production, ajoutez votre domaine et activez TLS automatique dans le `Caddyfile`.

### Configuration TLS (production)

Dans le `Caddyfile`, remplacez `:81` par votre domaine pour activer HTTPS automatique via Let's Encrypt :

```caddy
digitools.example.com {
    # ... même logique de routage
}
```

---

## Scripts utilitaires

Les scripts Python de maintenance vivent dans `scripts/`. Aucun n'est requis pour faire tourner l'app ; ils servent au développement.

| Script | Rôle |
|---|---|
| `rename-toolforge-to-digitools.py` | Renomme ToolForge → DigiTools dans `layout.tsx`, `en.json`, `fr.json`, `robots.txt`. Préserve volontairement la clé `toolforge-locale` pour la rétro-compatibilité. |
| `generate-pwa-icons.py` | Régénère toutes les icônes PWA à partir de `public/logo-digi.svg` (via `cairosvg` + `PIL`) : icon-192/512, maskable, apple-touch, favicons, og-image. |
| `add-video-downloader-i18n.py` | Ajoute les traductions EN/FR du téléchargeur vidéo dans `messages/*.json` (idempotent). |

Pour regénérer les icônes après modification du logo :

```bash
python3 scripts/generate-pwa-icons.py
```

---

## Confidentialité

DigiTools a été pensée pour préserver votre vie privée :

- ✅ **Aucun compte** — pas d'inscription, pas d'authentification
- ✅ **Aucun analytics** — pas de tracking, pas de télémétrie
- ✅ **Aucun upload** — tous les outils traitent vos données localement dans le navigateur
- ✅ **Aucun stockage serveur** — la seule donnée envoyée au backend est l'URL de la vidéo à télécharger (et le backend ne la conserve pas)
- ✅ **Préférences locales** — langue et thème stockés dans `localStorage`, jamais envoyés

### Le téléchargeur vidéo — ce qui sort de votre navigateur

Lorsque vous utilisez le téléchargeur :

1. L'URL que vous saisissez est envoyée au mini-service (`/api/info`)
2. Le mini-service interroge `yt-dlp` qui **contacte la plateforme source** (YouTube, TikTok, etc.) pour récupérer les métadonnées et l'URL directe du fichier vidéo
3. Cette URL directe est renvoyée à votre navigateur
4. Votre navigateur **télécharge la vidéo directement depuis la source**, sans repasser par le backend

Le mini-service ne voit jamais le contenu de la vidéo — il ne fait qu'agir comme annuaire d'URL. La vidéo elle-même transite uniquement entre la plateforme source et votre machine.

---

## Captures d'écran

Les captures sont disponibles dans `download/` :

- **Page d'accueil** — `digitools-pwa.png` (grille des 26 outils, header avec recherche + langue + thème)
- **Téléchargeur vidéo** — `digitools-video-downloader.png` (champ URL, sélection de qualité, aperçu)

---

## Licence

Ce projet est fourni tel quel, sans garantie. Adaptez la licence selon vos besoins (MIT, Apache-2.0, etc.).

---

## Crédits

- **[Next.js](https://nextjs.org/)** — framework React
- **[shadcn/ui](https://ui.shadcn.com/)** — composants UI
- **[Tailwind CSS](https://tailwindcss.com/)** — styles utilitaires
- **[FFmpeg](https://ffmpeg.org/)** — traitement média (compilation WASM par [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm))
- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** — extraction de vidéos
- **[Caddy](https://caddyserver.com/)** — serveur web / proxy inverse
- **[lucide](https://lucide.dev/)** — icônes
- **[Bun](https://bun.sh/)** — runtime JavaScript
