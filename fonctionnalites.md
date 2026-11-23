# Fonctionnalités — DigiTools

> État des fonctionnalités de l'app et feuille de route des évolutions à développer.

---

## 1. Fonctionnalités actuelles

### 1.1 Plateforme

| Fonctionnalité | Détail |
|---|---|
| **26 outils** | Répartis en 6 catégories (développeur, encodage, texte, image, design, média) |
| **100 % client-side** | Traitement local dans le navigateur — aucun upload serveur |
| **Bilingue EN/FR** | Détection automatique de la langue, persistance `localStorage` |
| **Thème clair / sombre / système** | Persistant, via `next-themes` |
| **Recherche globale** | Sur nom, description, alias et mots-clés (EN+FR) |
| **Raccourci `/`** | Focus instantané sur la recherche |
| **Routage par hash** | `/#/tools/<slug>` — partage d'URL sans rechargement |
| **PWA installable** | Manifest + icônes, lancement standalone |
| **Mode hors-ligne** | Service worker : shell cache-first, assets SWR, API network-only |
| **Raccourcis d'app** | JSON Formatter, QR Code, Mot de passe |
| **Toasts** | Retour d'action via sonner |
| **Confidentialité** | Aucun compte, aucun tracker, aucune collecte de données |

### 1.2 Outils par catégorie

#### 🧑‍💻 Développeur (5)
| Slug | Fonction |
|---|---|
| `json-formatter` | Indenter, valider, formater du JSON |
| `code-formatter` | Formater du code source multi-langages |
| `html-formatter` | Indenter / nettoyer du HTML |
| `css-formatter` | Indenter / organiser du CSS |
| `javascript-formatter` | Indenter / reformater du JS |

#### 🔐 Encodage & générateurs (5)
| Slug | Fonction |
|---|---|
| `base64` | Encoder / décoder Base64 |
| `url-encoder` | Encoder / décoder des composants d'URL |
| `uuid-generator` | Générer des UUID v4 |
| `password-generator` | Mots de passe sécurisés personnalisables |
| `qr-code` | Générer des QR codes (texte / URL) |

#### 📝 Texte (5)
| Slug | Fonction |
|---|---|
| `markdown-previewer` | Aperçu Markdown en direct (GFM) |
| `regex-tester` | Tester et mettre en évidence des regex |
| `text-diff` | Diff visuel entre deux textes |
| `word-counter` | Statistiques : mots, caractères, lignes, temps de lecture |
| `case-converter` | UPPERCASE, lowercase, camelCase, snake_case… |

#### 🖼️ Image (5)
| Slug | Fonction |
|---|---|
| `image-compressor` | Réduire la taille (qualité réglable) |
| `image-resizer` | Changer les dimensions |
| `image-cropper` | Recadrage interactif |
| `image-converter` | PNG ↔ JPG ↔ WebP ↔ … |
| `svg-optimizer` | Minifier / nettoyer du SVG |

#### 🎨 Design & utilitaires (2)
| Slug | Fonction |
|---|---|
| `color-converter` | HEX ↔ RGB ↔ HSL + sélecteur |
| `timestamp-converter` | Unix ↔ date lisible (s/ms, UTC/local) |

#### 🎬 Média (4)
| Slug | Fonction |
|---|---|
| `video-converter` | MP4 ↔ WebM ↔ … (FFmpeg WASM) |
| `video-compressor` | Compresser vidéo (FFmpeg WASM) |
| `audio-converter` | MP3 ↔ WAV ↔ … (FFmpeg WASM) |
| `tiktok-date-extractor` | Date de publication estimée depuis un lien TikTok |

### 1.3 Points forts techniques

- **Lazy-loading** : chaque outil est chargé à la demande
- **FFmpeg WASM** : conversion / compression média sans serveur (~30 Mo, mis en cache)
- **Shadcn/ui + Tailwind 4** : UI cohérente et responsive
- **Zustand** : store global (route, recherche, catégorie)
- **i18n custom** : pas de dépendance lourde, fallback EN

---

## 2. Suggestions & fonctionnalités futures à développer

### 2.1 Court terme (quick wins)

| Priorité | Fonctionnalité | Description |
|---|---|---|
| 🔴 Haute | **Favoris / outils épinglés** | Marquer des outils en favoris (`localStorage`) + section sur l'accueil |
| 🔴 Haute | **Historique des actions** | Dernières conversions / générations (local), re-exécution en 1 clic |
| 🔴 Haute | **Raccourcis clavier globaux** | `Ctrl+K` palette de commandes type Spotlight / Raycast |
| 🟡 Moyenne | **Partager un résultat** | Encoder le résultat dans l'URL (ex. diff, base64) pour partager un lien |
| 🟡 Moyenne | **Drag & drop universel** | Déposer un fichier / texte sur n'importe quel outil compatible |
| 🟡 Moyenne | **Export lot (batch)** | Traiter plusieurs fichiers d'un coup (images, conversions) |
| 🟢 Basse | **Raccourcis d'app étendus** | Ajouter plus de raccourcis PWA (Convertisseur, Diff…) |
| 🟢 Basse | **Raccourcis clavier dans les outils** | `Ctrl+Enter` pour valider, `Esc` pour reset |

### 2.2 Nouveaux outils (par catégorie)

#### Développeur
| Slug proposé | Description |
|---|---|
| `jwt-decoder` | Décoder / inspecter des tokens JWT (header, payload, exp) |
| `lorem-ipsum` | Générer du texte placeholder (mots / paragraphes / HTML) |
| `html-minifier` | Minifier du HTML en un clic |
| `yaml-json` | Convertir YAML ↔ JSON |
| `sql-formatter` | Formater / pretty-print du SQL |
| `cron-parser` | Expliquer une expression cron en langage clair |
| `http-status-codes` | Référence rapide des codes HTTP |
| `diff-json` | Diff structuré entre deux objets JSON |
| `hash-generator` | MD5 / SHA-1 / SHA-256 / SHA-512 (WebCrypto) |

#### Encodage
| Slug proposé | Description |
|---|---|
| `html-entities` | Encoder / décoder les entités HTML |
| `jwt-encoder` | Créer / signer un JWT (HS256) côté client |
| `binary-converter` | Décimal ↔ binaire ↔ hexadécimal |
| `roman-numerals` | Chiffres romains ↔ arabes |
| `morse-code` | Encoder / décoder le morse |

#### Texte
| Slug proposé | Description |
|---|---|
| `text-to-speech` | Synthèse vocale (Web Speech API) |
| `speech-to-text` | Dictée → texte (Web Speech API) |
| `slugify` | Générer des slugs SEO à partir d'un titre |
| `lorem-generator` | (voir ci-dessus) |
| `find-replace` | Rechercher / remplacer avec regex et aperçu |

#### Image
| Slug proposé | Description |
|---|---|
| `image-info` | Métadonnées EXIF / dimensions / poids |
| `bg-remover` | Supprimer l'arrière-plan (via modèle local type remove.bg alternative) |
| `palette-extractor` | Extraire la palette de couleurs d'une image |
| `favicon-generator` | Générer favicon.ico + PNG depuis un SVG/PNG |
| `screenshot-tool` | Capturer une zone / une page (Screen Capture API) |

#### Design
| Slug proposé | Description |
|---|---|
| `gradient-generator` | Générer des dégradés CSS (export CSS / SVG) |
| `box-shadow-generator` | Composer des box-shadows visuellement |
| `border-radius` | Aperçu interactif des border-radius |
| `contrast-checker` | WCAG AA/AAA sur deux couleurs |
| `font-pairing` | Tester des paires de polices Google Fonts |
| `spacing-scale` | Échelle d'espacement type Tailwind / Material |
| `mockup-generator` | Cadres / grilles de maquettes simples |

#### Média
| Slug proposé | Description |
|---|---|
| `video-trimmer` | Couper une vidéo (in/out) avec FFmpeg WASM |
| `video-to-gif` | Convertir un extrait vidéo en GIF |
| `audio-trimmer` | Couper un fichier audio |
| `waveform-viewer` | Visualiser / extraire une forme d'onde audio |
| `screenshot-video` | Extraire des frames d'une vidéo |
| `media-info` | Codecs, durée, bitrate d'un fichier média |

### 2.3 Fonctionnalités produit (au-delà des outils)

| Priorité | Fonctionnalité | Description |
|---|---|---|
| 🔴 Haute | **Palette de commandes (Cmd/Ctrl+K)** | Naviguer + lancer un outil sans toucher la souris |
| 🔴 Haute | **Outils favoris + derniers utilisés** | Personnaliser l'accueil selon l'usage réel |
| 🔴 Haute | **Workspaces / collections** | Regrouper des résultats (ex. set de couleurs, snippets) |
| 🟡 Moyenne | **Thèmes de marque** | Palette custom (couleur primaire) mémorisée |
| 🟡 Moyenne | **PWA offline complète** | Améliorer le cache des chunks lazy pour 100 % offline dès le 1er lancer |
| 🟡 Moyenne | **Partage social** | Open Graph dynamique par outil + description SEO |
| 🟡 Moyenne | **Mode sombre auto par heure** | Basculer selon l'heure locale (au-delà du système) |
| 🟢 Basse | **Analytics respectueux** | Stats anonymes optionnelles (Plausible / Umami auto-hébergé) |
| 🟢 Basse | **Version desktop (Tauri)** | Empaqueter l'app en app bureau |
| 🟢 Basse | **API publique légère** | Endpoints limités pour certains outils (si besoin serveur) |
| 🟢 Basse | **Marketplace de presets** | Partager des presets d'outils (thèmes, formats, regex…) |

### 2.4 Qualité de vie dev / tech debt

| Priorité | Sujet | Description |
|---|---|---|
| 🔴 Haute | **Tests unitaires** | Vitest sur la logique pure (parse, convert, extract) |
| 🔴 Haute | **Tests E2E** | Playwright sur les flux critiques des outils |
| 🔴 Haute | **CI GitHub Actions** | Lint + typecheck + test + build à chaque PR |
| 🟡 Moyenne | **Corriger les erreurs lint** | 5× `react-hooks/set-state-in-effect` préexistantes |
| 🟡 Moyenne | **Performance bundle** | Analyser avec `@next/bundle-analyzer`, réduire le JS initial |
| 🟡 Moyenne | **A11y audit** | Contraste, focus trap, ARIA sur tous les outils |
| 🟢 Basse | **Storybook** | Catalogue des composants UI partagés |
| 🟢 Basse | **Error boundary global** | Catch des crashes d'outil avec recovery propre |
| 🟢 Basse | **Upgrade Next 16.4+** | Quand la régression Turbopack/FFmpeg sera corrigée |

### 2.5 Idées exploratoires (plus loin)

- **Assistant contextuel** : suggérer l'outil adapté depuis une description (« je veux compresser une vidéo » → Compresseur)
- **Comparaison d'outils** : avant/après côte à côte (compression image, diff…)
- **Mode sombre automatique pour captures** : export des résultats en PNG de qualité (canvas)
- **Multi-pages PDF** : assembler / fusionner / scinder des PDF (pdf-lib)
- **Fichier de travail** : projet temporaire local (IndexedDB) pour enchaîner plusieurs traitements
- **Notifications de fin de traitement** | Web Notifications quand une conversion longue se termine
- **Téléchargeur vidéo** | Réintroduire plus tard (option serveur dédié ou lib pure JS — cf. discussions antérieures)

---

## 3. Comment prioriser

1. **Quick wins** (§2.1) → impact utilisateur immédiat, faible coût
2. **Nouveaux outils** (§2.2) → suivre la demande réelle / analytics anonymes
3. **Produit** (§2.3) → fidélisation et différenciation
4. **Qualité** (§2.4) → bloquant pour scaler sereinement
5. **Exploratoire** (§2.5) → spikes ponctuels, décision go/no-go

---

*Dernière mise à jour : 2026-11-23*
