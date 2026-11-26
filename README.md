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
- [SEO](#seo)
- [Déploiement](#déploiement)
- [Scripts utilitaires](#scripts-utilitaires)
- [Confidentialité](#confidentialité)
- [Captures d'écran](#captures-dcran)

---

## Présentation

**DigiTools** est une collection de 26 utilitaires navigateur regroupés dans une seule application web progressive (PWA). Conçue pour les développeurs, rédacteurs et créateurs de contenu, elle se veut :

- **Rapide** — chargement à la demande (lazy-loading), traitement 100 % côté client
- **Privée** — vos données ne quittent jamais votre navigateur
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
- 🔖 **Raccourcis d'app** — accès direct à des outils depuis l'icône de l'app (JSON, QR Code, Mot de passe)
- 🍞 **Notifications toast** (sonner) pour le retour d'action
- 🛣️ **Routage App Router** — URLs indexables par Google : `/tools/<slug>` et `/category/<slug>` (l'ancien routage par hash `/#/tools/<slug>` redirige automatiquement)
- 📈 **SEO complet** — `sitemap.xml`, `robots.txt`, métadonnées par page, JSON-LD (BreadcrumbList, SoftwareApplication, FAQPage, ItemList)
- 📄 **Pages légales** — `/privacy`, `/terms`, `/cookies` (bilingues, indexables)
- 🎬 **FFmpeg WASM** — conversion/compression vidéo et audio sans serveur
- 🔐 **Aucune collecte de données** — pas d'analytics, pas de trackers, pas de compte requis

---

## Les 26 outils

Tous les outils sont traités côté client. Les composants sont lazy-loadés : seuls les outils ouverts téléchargent leur code et leurs dépendances.

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
| `password-generator` | Générateur de Mot de Passe | Mots de passe sécurisables personnalisables |
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
| `tiktok-date-extractor` | Extracteur de Date TikTok | Date de publication estimée depuis un lien TikTok | ✅ Oui |

> ℹ️ **Note sur le mode hors-ligne des outils média** : FFmpeg WASM pèse ~30 Mo. Au premier lancement, le navigateur télécharge ces fichiers ; ils sont ensuite mis en cache par le navigateur et disponibles hors-ligne.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19**, **Tailwind CSS 4**, **shadcn/ui** (Radix UI) |
| Langage | **TypeScript 5** |
| État | **Zustand** (store recherche) |
| Thème | **next-themes** (clair / sombre / système) |
| i18n | Contexte React personnalisé (EN/FR) avec fallback + cookie SSR |
| SEO | Métadonnées Next.js, `sitemap.ts`, `robots.ts`, JSON-LD |
| Icônes | **lucide-react** |
| Notifications | **sonner** |
| Média | **@ffmpeg/ffmpeg** (WASM) |
| Base de données | **Prisma** + SQLite (boilerplate, non utilisée par les outils) |
| Runtime | **Node** / **npm** |

---

## Démarrage rapide

### Prérequis

- **Node.js** ≥ 20
- **npm**

### Installation

```bash
# 1. Cloner le dépôt
git clone <votre-repo> digitools
cd digitools

# 2. Installer les dépendances
npm install
```

### Lancement en développement

```bash
npm run dev
```

Puis ouvrir **http://localhost:3000** dans le navigateur.

### Build et lancement en production

```bash
# Build
npm run build

# Lancer
npm run start
```

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
                                 │ HTTP (:3000)
                                 ▼
                    ┌──────────────────────────┐
                    │     Next.js (port 3000)   │
                    │     App shell + 26 outils │
                    │     + PWA                │
                    └──────────────────────────┘
```

Tous les outils tournent **100 % dans le navigateur** — aucun mini-service, aucun proxy requis pour leur fonctionnement.

### Arborescence du projet

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout racine (metadata, i18n SSR, JSON-LD)
│   │   ├── page.tsx               # Page d'accueil
│   │   ├── sitemap.ts             # Sitemap XML (outils + catégories + légal)
│   │   ├── robots.ts              # Robots.txt
│   │   ├── tools/[slug]/          # Page SEO par outil (SSG)
│   │   ├── category/[slug]/       # Hub SEO par catégorie (SSG)
│   │   ├── privacy/               # Politique de confidentialité
│   │   ├── terms/                 # Conditions d'utilisation
│   │   └── cookies/               # Politique de cookies
│   ├── components/
│   │   ├── layout/                # AppShell, Header, Footer, theme, language switcher
│   │   ├── home/                  # Page d'accueil (hero → outils → features → CTA)
│   │   ├── legal/                 # Composant partagé des pages légales
│   │   ├── tool/                  # ToolView, ToolLayout, ToolCard
│   │   └── tools/                 # 26 composants d'outils (lazy-loaded)
│   ├── data/tools.tsx             # Registre TOOLS[] (slug, catégorie, icône)
│   ├── lib/
│   │   ├── i18n/                  # Contexte i18n + helpers SSR (server.ts)
│   │   └── site.ts                # SITE_URL (NEXT_PUBLIC_SITE_URL)
│   ├── messages/                  # en.json + fr.json (+ sections legal)
│   └── store/                     # Zustand (recherche)
├── public/
│   ├── manifest.webmanifest       # Manifest PWA
│   ├── sw.js                      # Service worker
│   ├── sw-register.js             # Enregistrement SW (static)
│   ├── logo-digi.svg              # Logo SVG (header + footer)
│   ├── icon-*.png                 # Icônes PWA (192, 512, maskable, apple-touch)
│   ├── favicon-*.png              # Favicons 16/32
│   ├── og-image.png               # Aperçu réseaux sociaux (1200×630)
│   └── ffmpeg/                    # FFmpeg WASM (core.js + core.wasm + worker)
├── scripts/                       # Utilitaires Python (voir ci-dessous)
├── prisma/                        # Schema Prisma (boilerplate)
├── .env                           # NEXT_PUBLIC_SITE_URL à définir en prod
└── package.json                   # Dépendances + scripts npm
```

### Routes

| Route | Rôle |
|---|---|
| `/` | Accueil : hero → grille d'outils → features → CTA |
| `/tools/<slug>` | Page outil (H1, JSON-LD, outils liés) |
| `/category/<slug>` | Hub catégorie (ItemList JSON-LD) |
| `/privacy` `/terms` `/cookies` | Pages légales bilingues |
| `/sitemap.xml` `/robots.txt` | SEO technique |
| `/#/tools/<slug>` | Redirection automatique vers `/tools/<slug>` (liens legacy) |

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
- **3 raccourcis d'app** : JSON Formatter, QR Code, Générateur de Mot de Passe
- **1 capture d'écran** : og-image.png (1200×630)

### Service Worker

Le fichier `public/sw.js` (cache version `digitools-v1`) applique des stratégies de cache différenciées :

| Type de ressource | Stratégie |
|---|---|
| Shell HTML / navigations | **Network-first** avec fallback sur le shell caché |
| Assets statiques (`/_next/static/`, polices, icônes) | **Stale-while-revalidate** |
| API (`/api/`) | **Network-only** (jamais en cache) |
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

---

## Internationalisation

L'app est **bilingue anglais / français** via un contexte React personnalisé (`src/lib/i18n/i18n-context.tsx`).

- **Messages** : `src/messages/en.json` et `src/messages/fr.json`, importés statiquement
- **Détection SSR** : la langue est lue côté serveur depuis le cookie `toolforge-locale` (pas de mismatch d'hydration). Sans cookie → `en` au premier rendu, puis bascule après montage selon `localStorage` ou `navigator.languages` (FR si une langue française est présente, sinon EN)
- **Persistance** : `localStorage` + cookie `toolforge-locale` (1 an, `SameSite=Lax`) + attribut `<html lang>`
- **Fallback** : si une clé manque dans la langue active, on retombe sur l'anglais
- **Sélecteur** : composant `LanguageSwitcher` dans le header

> ℹ️ La clé de stockage `toolforge-locale` a été conservée intentionnellement lors du renommage ToolForge → DigiTools, pour que les utilisateurs existants gardent leur préférence de langue.

---

## SEO

Chaque outil et chaque catégorie possède sa propre URL indexable :

- **Métadonnées** — `generateMetadata` par route (title, description, canonical, OpenGraph, locale)
- **Sitemap** — `src/app/sitemap.ts` génère les URLs des outils, catégories et pages légales
- **Robots** — `src/app/robots.ts`
- **JSON-LD** — BreadcrumbList, SoftwareApplication, FAQPage (pages outil) ; ItemList (catégories)
- **`NEXT_PUBLIC_SITE_URL`** — à définir dans `.env` en production (fallback `http://localhost:3000`)

---

## Déploiement

Le déploiement est simple — une seule app Next.js :

```bash
# 1. Définir l'URL publique
echo "NEXT_PUBLIC_SITE_URL=https://votre-domaine.com" >> .env

# 2. Build et lancer
npm run build
npm run start
```

Sans `NEXT_PUBLIC_SITE_URL`, le sitemap et les canonicals utiliseront `http://localhost:3000`.

---

## Scripts utilitaires

Les scripts Python de maintenance vivent dans `scripts/`. Aucun n'est requis pour faire tourner l'app ; ils servent au développement.

| Script | Rôle |
|---|---|
| `rename-toolforge-to-digitools.py` | Renomme ToolForge → DigiTools dans les fichiers sources. Préserve volontairement la clé `toolforge-locale` pour la rétro-compatibilité. |
| `generate-pwa-icons.py` | Régénère toutes les icônes PWA à partir de `public/logo-digi.svg` (via `cairosvg` + `PIL`) : icon-192/512, maskable, apple-touch, favicons, og-image. |

Pour régénérer les icônes après modification du logo :

```bash
python3 scripts/generate-pwa-icons.py
```

---

## Confidentialité

DigiTools a été pensée pour préserver votre vie privée :

- ✅ **Aucun compte** — pas d'inscription, pas d'authentification
- ✅ **Aucun analytics** — pas de tracking, pas de télémétrie
- ✅ **Aucun upload** — tous les outils traitent vos données localement dans le navigateur
- ✅ **Aucun stockage serveur** — rien n'est envoyé à un backend
- ✅ **Préférences locales** — langue et thème stockés dans `localStorage`, jamais envoyés

Les documents légaux sont disponibles dans le footer :

- [`/privacy`](/privacy) — Politique de confidentialité
- [`/terms`](/terms) — Conditions d'utilisation
- [`/cookies`](/cookies) — Politique de cookies

---

## Captures d'écran

Les captures sont disponibles dans `download/` :

- **Page d'accueil** — `digitools-pwa.png` (grille des outils, header avec recherche + langue + thème)

---

## Licence

Ce projet est fourni tel quel, sans garantie. Adaptez la licence selon vos besoins (MIT, Apache-2.0, etc.).

---

## Crédits

- **[Next.js](https://nextjs.org/)** — framework React
- **[shadcn/ui](https://ui.shadcn.com/)** — composants UI
- **[Tailwind CSS](https://tailwindcss.com/)** — styles utilitaires
- **[FFmpeg](https://ffmpeg.org/)** — traitement média (compilation WASM par [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm))
- **[lucide](https://lucide.dev/)** — icônes
