#!/usr/bin/env python3
"""Add video-downloader translations to en.json and fr.json without touching
existing keys. Idempotent — if the entry already exists, it overwrites it."""
import json
from pathlib import Path

MESSAGES_DIR = Path("/home/z/my-project/src/messages")

# English translations
EN_ENTRY = {
    "name": "Video Downloader",
    "short": "Download videos from YouTube, TikTok, Instagram",
    "description": "Paste a video URL from YouTube, TikTok, Instagram, Facebook, Vimeo or X/Twitter to download it. Choose video (MP4) or audio (MP3) and pick the quality. The backend mini-service extracts the direct stream URL using yt-dlp, and the browser downloads it directly to you — your data never touches a third-party server.",
    "urlLabel": "Video URL",
    "placeholder": "https://www.youtube.com/watch?v=...",
    "fetch": "Get formats",
    "fetching": "Fetching video info...",
    "videoMode": "Video (MP4)",
    "audioMode": "Audio (MP3)",
    "videoQuality": "Video quality",
    "audioQuality": "Audio quality",
    "noFormat": "No format available for this mode",
    "download": "Download",
    "downloading": "Starting download...",
    "openOriginal": "Open original page",
    "empty": {
        "title": "Paste a video URL to get started",
        "description": "Supports YouTube, TikTok, Instagram, Facebook, Vimeo, X/Twitter and more."
    },
    "privacy": "The download is performed by your browser directly from the video source. ToolForge's backend only extracts the direct URL — your video is never stored on our servers.",
    "toast": {
        "fetched": "Video info retrieved",
        "downloading": "Download started"
    },
    "errors": {
        "emptyUrl": "Please paste a video URL first",
        "fetchFailed": "Failed to fetch video info. The platform may block automated requests, or the URL is invalid/private.",
        "downloadFailed": "Download failed. Try a different format or quality."
    },
    "detail": {
        "format": "Format",
        "resolution": "Resolution",
        "size": "File size",
        "bitrate": "Bitrate"
    },
    "faq": [
        {
            "q": "Why does the download sometimes fail?",
            "a": "Some platforms (especially YouTube) actively block automated access. If a download fails, try again later, or use a different platform. Private videos and member-only content are never accessible."
        },
        {
            "q": "Why are there two modes (Video and Audio)?",
            "a": "Video mode downloads the full MP4 with both video and audio. Audio mode extracts only the audio track as MP3, ideal for music and podcasts — much smaller file size."
        },
        {
            "q": "What about video quality?",
            "a": "Available qualities depend on the source. Higher resolutions (1080p, 4K) require more bandwidth and storage. For YouTube, 720p is usually a good balance of quality and size."
        },
        {
            "q": "Is this legal?",
            "a": "Downloading videos for personal, offline use is generally allowed in most jurisdictions, but redistributing copyrighted content is not. Always respect the platform's terms of service and the creator's rights."
        },
        {
            "q": "Does the video pass through ToolForge servers?",
            "a": "No. Our backend only extracts the direct stream URL using yt-dlp. The actual video bytes flow directly from the source platform to your browser."
        }
    ]
}

# French translations
FR_ENTRY = {
    "name": "Téléchargeur de Vidéos",
    "short": "Téléchargez des vidéos YouTube, TikTok, Instagram",
    "description": "Collez un lien vidéo depuis YouTube, TikTok, Instagram, Facebook, Vimeo ou X/Twitter pour la télécharger. Choisissez vidéo (MP4) ou audio (MP3) et la qualité. Le mini-service backend extrait l'URL directe du flux avec yt-dlp, puis votre navigateur télécharge la vidéo directement — vos données ne transitent jamais par un serveur tiers.",
    "urlLabel": "URL de la vidéo",
    "placeholder": "https://www.youtube.com/watch?v=...",
    "fetch": "Récupérer les formats",
    "fetching": "Récupération des infos vidéo...",
    "videoMode": "Vidéo (MP4)",
    "audioMode": "Audio (MP3)",
    "videoQuality": "Qualité vidéo",
    "audioQuality": "Qualité audio",
    "noFormat": "Aucun format disponible pour ce mode",
    "download": "Télécharger",
    "downloading": "Démarrage du téléchargement...",
    "openOriginal": "Ouvrir la page originale",
    "empty": {
        "title": "Collez une URL de vidéo pour commencer",
        "description": "Supporte YouTube, TikTok, Instagram, Facebook, Vimeo, X/Twitter et plus."
    },
    "privacy": "Le téléchargement est effectué directement par votre navigateur depuis la source vidéo. Le backend de ToolForge ne fait qu'extraire l'URL directe — votre vidéo n'est jamais stockée sur nos serveurs.",
    "toast": {
        "fetched": "Infos vidéo récupérées",
        "downloading": "Téléchargement démarré"
    },
    "errors": {
        "emptyUrl": "Veuillez coller une URL de vidéo d'abord",
        "fetchFailed": "Échec de la récupération des infos. La plateforme bloque peut-être les requêtes automatisées, ou l'URL est invalide/privée.",
        "downloadFailed": "Échec du téléchargement. Essayez un autre format ou qualité."
    },
    "detail": {
        "format": "Format",
        "resolution": "Résolution",
        "size": "Taille du fichier",
        "bitrate": "Débit"
    },
    "faq": [
        {
            "q": "Pourquoi le téléchargement échoue-t-il parfois ?",
            "a": "Certaines plateformes (surtout YouTube) bloquent activement l'accès automatisé. Si un téléchargement échoue, réessayez plus tard, ou utilisez une autre plateforme. Les vidéos privées et le contenu réservé aux membres ne sont jamais accessibles."
        },
        {
            "q": "Pourquoi deux modes (Vidéo et Audio) ?",
            "a": "Le mode Vidéo télécharge le MP4 complet avec vidéo et audio. Le mode Audio extrait uniquement la piste audio en MP3, idéal pour la musique et les podcasts — fichier beaucoup plus petit."
        },
        {
            "q": "Qu'en est-il de la qualité vidéo ?",
            "a": "Les qualités disponibles dépendent de la source. Les résolutions élevées (1080p, 4K) nécessitent plus de bande passante et de stockage. Pour YouTube, 720p est généralement un bon compromis qualité/taille."
        },
        {
            "q": "Est-ce légal ?",
            "a": "Télécharger des vidéos pour un usage personnel hors ligne est généralement autorisé dans la plupart des juridictions, mais la redistribution de contenu protégé par le droit d'auteur ne l'est pas. Respectez toujours les conditions d'utilisation de la plateforme et les droits des créateurs."
        },
        {
            "q": "La vidéo passe-t-elle par les serveurs de ToolForge ?",
            "a": "Non. Notre backend ne fait qu'extraire l'URL directe du flux avec yt-dlp. Les octets vidéo circulent directement de la plateforme source vers votre navigateur."
        }
    ]
}

# Also add error keys (shared with other tools)
EXTRA_ERRORS_EN = {
    "ffmpegLoadFailed": "Failed to load FFmpeg. Please refresh and try again.",
    "compressionFailed": "Compression failed: {message}",
}
EXTRA_ERRORS_FR = {
    "ffmpegLoadFailed": "Échec du chargement de FFmpeg. Rafraîchissez et réessayez.",
    "compressionFailed": "Échec de la compression : {message}",
}

def update_file(path: Path, entry: dict, extra_errors: dict):
    data = json.loads(path.read_text(encoding="utf-8"))
    data["tools"]["video-downloader"] = entry
    for k, v in extra_errors.items():
        if k not in data.get("errors", {}):
            data["errors"][k] = v
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {path}: video-downloader entry added ({len(entry)} keys)")

update_file(MESSAGES_DIR / "en.json", EN_ENTRY, EXTRA_ERRORS_EN)
update_file(MESSAGES_DIR / "fr.json", FR_ENTRY, EXTRA_ERRORS_FR)
print("Done.")
