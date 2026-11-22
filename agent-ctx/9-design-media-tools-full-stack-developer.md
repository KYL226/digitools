# Task 9 — Design & Media Tools

**Task ID:** 9-design-media-tools
**Agent:** full-stack-developer
**Task:** Build 5 design & media tools (Color Converter / Timestamp Converter / Video Converter / Video Compressor / Audio Converter)

## Files created (all under `src/components/tools/`)

| File | Named export | Type |
|------|---------------|------|
| `color-converter.tsx` | `ColorConverter` | Pure client-side |
| `timestamp-converter.tsx` | `TimestampConverter` | Pure client-side |
| `video-converter.tsx` | `VideoConverter` | Lazy FFmpeg WASM |
| `video-compressor.tsx` | `VideoCompressor` | Lazy FFmpeg WASM |
| `audio-converter.tsx` | `AudioConverter` | Lazy FFmpeg WASM |

## Packages installed

```
@ffmpeg/ffmpeg@0.12.15
@ffmpeg/util@0.12.2
@ffmpeg/core@0.12.10
```

## Infrastructure reused (from earlier tasks)

- `useI18n()` from `@/lib/i18n/i18n-context` — `t(key, params?)` for all user-facing strings.
- Shared components in `@/components/tool/`: `CopyButton`, `DownloadButton`, `ResetButton`, `ClearButton`, `FileDropzone`, `ErrorMessage`, `EmptyState`, `LoadingState`.
- shadcn UI primitives: `Button`, `Input`, `Label`, `Select`, `Tabs`, `Slider`, `Progress`, `Badge`, `Separator`.
- `cn` from `@/lib/utils`, `toast` from `sonner`.

## Verification

- `npx eslint src/components/tools/{color-converter,timestamp-converter,video-converter,video-compressor,audio-converter}.tsx` → 0 errors / 0 warnings.
- `npx tsc --noEmit --skipLibCheck` → 0 errors touching any of the 5 new files (remaining TS errors are pre-existing and unrelated: `socket.io-client`/`socket.io`, `skills/image-edit`, `skills/stock-analysis-skill`, `tool-layout.tsx` `any[]` cast).
- `curl http://localhost:3000/` → `HTTP 200`, `GET / 200 in 1162ms (compile: 997ms, render: 164ms)`. Previous "Module not found" entries in `dev.log` were stale (from BEFORE all 5 files existed); the most recent compilation state is success.

## FFmpeg WASM setup pattern

For the 3 FFmpeg tools (video-converter / video-compressor / audio-converter), FFmpeg is **lazily imported ONLY inside the Convert/Compress click handler** — not at file top-level:

```ts
const handleConvert = useCallback(async () => {
  // ...
  if (!ffmpegRef.current) {
    setLoading(true);
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)));
    const coreURL = await toBlobURL(FFMPEG_CORE_URL, "text/javascript");
    const wasmURL = await toBlobURL(FFMPEG_WASM_URL, "application/wasm");
    const classWorkerURL = await toBlobURL(FFMPEG_WORKER_URL, "text/javascript");
    await ffmpeg.load({ coreURL, wasmURL, classWorkerURL });
    ffmpegRef.current = ffmpeg;
    setLoading(false);
  } else {
    ffmpeg = ffmpegRef.current;
  }
  // ... writeFile / exec / readFile / Blob / URL.createObjectURL
}, [/* ... */]);
```

- CDN URLs (unpkg): `@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.{js,wasm}` + `@ffmpeg/ffmpeg@0.12.15/dist/esm/worker.js`.
- `toBlobURL(...)` fetches the cross-origin script and re-issues it as a same-origin blob URL so the worker can `importScripts` it.
- The FFmpeg instance is cached in a `useRef` so subsequent conversions skip the ~30MB reload.
- `readFile` result is normalized to `Uint8Array` via `data instanceof Uint8Array ? data : new Uint8Array(data)`.
- Object URLs are revoked in the `setResult` updater + a `useEffect` cleanup on unmount.

## Color converter implementation notes

- Single source of truth: `color: RGB {r,g,b}` (0–255 each), default `{r:59, g:130, b:246}` (#3b82f6).
- HEX parser: `/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i` — accepts `#rgb` shorthand + `#rrggbb`.
- RGB parser: `/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/` — accepts `rgb(r, g, b)` or bare `r, g, b`.
- HSL parser: strips `hsl(`/`)`, then splits on commas — accepts `hsl(h, s%, l%)` or `h, s, l`.
- Standard HSL↔RGB algorithm (hue 0–360, s/l 0–100; `c = (1 - |2l-1|) * s`, sextant lookup, `m = l - c/2` offset).
- Active-source ref tracks which field the user is currently typing in, so the non-active fields reflect canonical derived values while the active field shows the user's raw input (no feedback loops).

## Timestamp converter implementation notes

- Auto-detect seconds vs ms by digit count: `Math.floor(Math.abs(value)).toString().length > 10` → ms.
- For UTC mode, parses datetime-local as UTC via `Date.UTC(...)`; for local, via `new Date(year, month, ...)`.
- Shows both UTC and Local formatted strings + an `Intl.DateTimeFormat`-based human string respecting the tz toggle.
- RIGHT panel computes both seconds AND milliseconds, each with its own CopyButton.

## Video compressor implementation notes

- If target size set, probe duration via HTML5 `<video>` `loadedmetadata` event, then `bitrate = (targetSizeMB * 8192) / duration` kbits/sec → 1-pass libx264 encode with that bitrate.
- Otherwise CRF mode: `["-i","input","-c:v","libx264","-crf",String(crf),"-preset","medium","-c:a","aac","-b:a","128k","output.mp4"]`.
- 3-column before/after/reduction grid; emerald `-X%` badge when shrunk, secondary `+X%` when the file grew.

## Audio converter codec mapping

| Format | Extension | MIME | Codec |
|--------|-----------|------|-------|
| MP3 | `.mp3` | `audio/mpeg` | `libmp3lame` |
| WAV | `.wav` | `audio/wav` | `pcm_s16le` |
| OGG | `.ogg` | `audio/ogg` | `libvorbis` |
| AAC | `.aac` | `audio/aac` | `aac` |

Note: actual codec availability depends on the FFmpeg core build. `@ffmpeg/core@0.12.10` (single-threaded default) supports the basic codecs. If a specific codec is missing, the conversion will throw and the user sees `errors.conversionFailed` with the underlying error message.

## Caveats

The FFmpeg tools may not actually run end-to-end in the sandbox preview iframe due to cross-origin isolation headers / CSP restrictions, but:
- The UI fully renders (dropzone, format selector, slider, buttons, empty state).
- The lazy imports are syntactically valid (`await import("@ffmpeg/ffmpeg")` and `await import("@ffmpeg/util")`).
- If FFmpeg fails to load at runtime, the user sees a clear `errors.ffmpegLoadFailed` message with the underlying error in parentheses.
- All object URLs are properly cleaned up via `useEffect` unmount cleanup.
