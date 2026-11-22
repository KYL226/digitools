/**
 * Mini-service backend pour le téléchargement de vidéos.
 *
 * Architecture :
 * - /api/info  → exécute `yt-dlp --dump-json` pour récupérer les métadonnées
 *                (titre, auteur, miniature, durées, formats disponibles).
 * - /api/proxy  → stream la vidéo vers le navigateur depuis le serveur, en
 *                 passant les bons en-têtes, pour contourner les restrictions
 *                 CORS et le refus cross-origin.
 *
 * yt-dlp est utilisé en mode "extraction d'infos" (sans téléchargement). Le
 * téléchargement réel est streamé vers le client via /api/proxy, ce qui garde
 * les données vidéo côté navigateur (pas de stockage sur le serveur).
 *
 * Port : 3004 — exposé publiquement via Caddy avec l'en-tête XTransformPort.
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import { URL } from "node:url";

const PORT = 3004;
const YTDLP = "/home/z/.venv/bin/yt-dlp";

// CORS: le front est servi sur :81 via Caddy, mais on autorise tout car ce
// mini-service n'est accessible qu'à travers Caddy (qui fait le reverse proxy).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Plateformes supportées par yt-dlp — on valide avant d'appeler yt-dlp pour
// éviter les abus et donner une erreur claire.
const SUPPORTED_HOSTS = [
  "youtube.com", "youtu.be", "m.youtube.com",
  "tiktok.com",
  "instagram.com",
  "facebook.com", "fb.watch", "fb.com",
  "vimeo.com",
  "twitter.com", "x.com",
  "dailymotion.com",
  "twitch.tv",
  "soundcloud.com",
  "pinterest.com",
  "reddit.com",
  "streamable.com",
];

function isValidPlatform(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    return SUPPORTED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

function send(res: ServerResponse, status: number, body: any) {
  res.writeHead(status, { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; if (data.length > 1024 * 16) reject(new Error("Payload too large")); });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/** Exécute yt-dlp en mode --dump-json (n'effectue PAS de téléchargement). */
function runYtDlp(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const proc = spawn(YTDLP, ["--no-warnings", "--no-playlist", "--no-check-certificate", ...args], {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    let stdout = "";
    let stderr = "";
    let maxBytes = 100 * 1024 * 1024; // 100MB max output
    proc.stdout.on("data", (c: Buffer) => {
      stdout += c.toString();
      if (stdout.length > maxBytes) { try { proc.kill("SIGKILL"); } catch {} }
    });
    proc.stderr.on("data", (c: Buffer) => { stderr += c.toString(); });
    proc.on("close", (code) => resolve({ stdout, stderr, code }));
    proc.on("error", (err) => resolve({ stdout, stderr: stderr + "\n" + err.message, code: -1 }));
  });
}

/** GET /api/info?url=... — récupère les formats d'une vidéo.
 * Supporte deux modes:
 *  1. Plateforme reconnue (YouTube/TikTok/etc.) → yt-dlp --dump-json
 *  2. URL .mp4/.webm directe → on synthétise un format sans yt-dlp (utile aussi
 *     quand le sandbox bloque les anti-bot, et plus rapide pour les URL directes).
 */
async function handleInfo(req: IncomingMessage, res: ServerResponse) {
  const u = new URL(req.url || "", `http://localhost:${PORT}`);
  const videoUrl = u.searchParams.get("url");
  if (!videoUrl) return send(res, 400, { error: "Missing url parameter" });

  // Mode "direct": si l'URL finit par une extension vidéo/audio connue,
  // on skip yt-dlp et on synthétise un format simple.
  const directExt = /\.(mp4|webm|mkv|mov|avi|m4a|mp3|ogg|wav|aac|opus)$/i.test(videoUrl);

  if (directExt && !isValidPlatform(videoUrl)) {
    const ext = (videoUrl.match(/\.([a-z0-9]+)$/i) || [])[1] || "mp4";
    const isAudio = ["mp3","ogg","wav","aac","opus","m4a"].includes(ext.toLowerCase());
    return send(res, 200, {
      title: (videoUrl.split("/").pop() || "video").split("?")[0],
      uploader: null,
      duration: null,
      thumbnail: null,
      webpage_url: videoUrl,
      extractor: "direct",
      is_live: false,
      formats: [{
        format_id: "0",
        ext: ext.toLowerCase(),
        quality: 720,
        height: isAudio ? null : 720,
        width: isAudio ? null : 1280,
        fps: null,
        vcodec: isAudio ? "none" : "unknown",
        acodec: isAudio ? "unknown" : "none",
        filesize: null,
        tbr: null,
        url: videoUrl,
      }],
      best_combined: "0",
    });
  }

  if (!isValidPlatform(videoUrl)) {
    return send(res, 400, { error: "Unsupported platform. Supported: YouTube, TikTok, Instagram, Facebook, Vimeo, X/Twitter, etc." });
  }

  console.log(`[info] ${videoUrl}`);
  const result = await runYtDlp([
    "--dump-json",
    "--no-playlist",
    "--skip-download",
    "--no-warnings",
    videoUrl,
  ]);

  if (result.code !== 0 || !result.stdout.trim()) {
    console.error("[info] yt-dlp failed:", result.stderr.slice(0, 500));
    return send(res, 502, {
      error: "yt-dlp failed to extract video info",
      detail: result.stderr.split("\n").filter(Boolean).slice(-3).join(" ").slice(0, 500),
    });
  }

  try {
    const info = JSON.parse(result.stdout.split("\n").filter(Boolean)[0]);
    // On ne renvoie que ce qui est utile côté client (poids raisonnable).
    const formats = (info.formats || [])
      .filter((f: any) => f.url && (f.vcodec !== "none" || f.acodec !== "none"))
      .map((f: any) => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: f.quality,
        height: f.height,
        width: f.width,
        fps: f.fps,
        vcodec: f.vcodec,
        acodec: f.acodec,
        filesize: f.filesize || f.filesize_approx || null,
        tbr: f.tbr, // total bitrate kbps
        abr: f.abr,
        vbr: f.vbr,
        url: f.url, // URL directe (sera streamée via /api/proxy)
      }))
      .sort((a: any, b: any) => (b.height || 0) - (a.height || 0) || (b.tbr || 0) - (a.tbr || 0));

    return send(res, 200, {
      title: info.title,
      uploader: info.uploader || info.channel,
      duration: info.duration,
      thumbnail: info.thumbnail,
      webpage_url: info.webpage_url,
      extractor: info.extractor_key,
      is_live: !!info.is_live,
      formats,
      // Format "best" simple (un seul fichier contenant audio+vidéo)
      best_combined: formats.find((f: any) => f.vcodec !== "none" && f.acodec !== "none")?.format_id || null,
    });
  } catch (e) {
    return send(res, 502, { error: "Failed to parse yt-dlp output", detail: String(e) });
  }
}

/** GET /api/proxy?url=... — stream la ressource vers le client (contourne CORS). */
async function handleProxy(req: IncomingMessage, res: ServerResponse) {
  const u = new URL(req.url || "", `http://localhost:${PORT}`);
  const targetUrl = u.searchParams.get("url");
  if (!targetUrl) return send(res, 400, { error: "Missing url parameter" });
  let parsed: URL;
  try { parsed = new URL(targetUrl); } catch { return send(res, 400, { error: "Invalid url" }); }
  if (!parsed.protocol.startsWith("http")) return send(res, 400, { error: "Only http/https supported" });

  console.log(`[proxy] ${targetUrl.slice(0, 100)}...`);
  try {
    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!resp.ok && resp.status !== 206) {
      console.error("[proxy] upstream returned", resp.status);
      return send(res, 502, { error: `Upstream returned ${resp.status}` });
    }

    // Headers CORS + force download
    const headers: Record<string, string> = { ...CORS_HEADERS };
    headers["Content-Type"] = resp.headers.get("content-type") || "application/octet-stream";
    if (resp.headers.get("content-length")) headers["Content-Length"] = resp.headers.get("content-length")!;
    if (resp.headers.get("content-range")) headers["Content-Range"] = resp.headers.get("content-range")!;
    headers["Content-Disposition"] = `attachment; filename="video.${(resp.headers.get("content-type") || "").includes("audio") ? "mp3" : "mp4"}"`;
    headers["Accept-Ranges"] = "bytes";
    res.writeHead(200, headers);

    if (resp.body) {
      const reader = resp.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (e: any) {
    console.error("[proxy] error:", e.message);
    if (!res.headersSent) send(res, 502, { error: "Proxy fetch failed", detail: String(e.message) });
    else res.end();
  }
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }
  const u = new URL(req.url || "", `http://localhost:${PORT}`);
  try {
    if (u.pathname === "/api/info" && req.method === "GET") return await handleInfo(req, res);
    if (u.pathname === "/api/proxy" && req.method === "GET") return await handleProxy(req, res);
    if (u.pathname === "/api/health" || u.pathname === "/") return send(res, 200, { ok: true, service: "video-downloader", version: "1.0.0" });
    return send(res, 404, { error: "Not found" });
  } catch (e: any) {
    console.error("[server] unhandled:", e);
    if (!res.headersSent) send(res, 500, { error: "Internal error", detail: e.message });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`▶ Video Downloader mini-service running on http://localhost:${PORT}`);
  console.log(`  • GET  /api/info?url=<video-url>  → metadata + available formats`);
  console.log(`  • GET  /api/proxy?url=<direct-url> → streams the media to the browser`);
});
