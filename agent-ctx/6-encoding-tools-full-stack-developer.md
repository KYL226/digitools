---
Task ID: 6-encoding-tools
Agent: full-stack-developer
Task: Build 5 encoding & generator tools (Base64 / URL / UUID / Password / QR)

Work Log:
- Read worklog.md and existing infrastructure: i18n-context (`useI18n` → `t`), shared components (`CopyButton`, `DownloadButton`, `ResetButton`/`ClearButton`, `ErrorMessage`/`EmptyState`/`LoadingState`, `FileDropzone`), shadcn UI primitives (Button, Input, Textarea, Label, Select, Slider, Switch, Tabs, ScrollArea, Card, Progress).
- Inspected `src/messages/en.json` for translation keys belonging to `tools.base64.*`, `tools.url-encoder.*`, `tools.uuid-generator.*`, `tools.password-generator.*`, `tools.qr-code.*` plus `common.*` and `errors.*`.
- Confirmed `src/components/layout/router.tsx` lines 18–22 expect named exports: `Base64Tool`, `UrlEncoder`, `UuidGenerator`, `PasswordGenerator`, `QrCodeGenerator`.
- Inspected `package.json` — `uuid` already present, but `qrcode` was NOT installed. Ran `bun add qrcode` and `bun add -D @types/qrcode` (resolves to `qrcode@1.5.4` + `@types/qrcode@1.5.6`). Verified browser field in `qrcode/package.json` so Next.js bundles the browser build.
- Built `src/components/tools/base64.tsx` → `Base64Tool`:
  - Unicode-aware helpers: `encodeBase64` uses `TextEncoder` → binary string → `btoa`, chunked in 0x8000-byte slices to dodge the `String.fromCharCode.apply` argument cap.
  - `decodeBase64` strips whitespace then `atob` → `Uint8Array` → `TextDecoder("utf-8")`.
  - Output and error are derived in `useMemo` (no manual button press — typing/toggling the mode recomputes immediately). The memo returns `{ output, error }`; a `useEffect` then syncs `error` to state so `<ErrorMessage>` can render.
  - Mode toggle via shadcn `Tabs` (Encode/Decode). Two-column input/output layout (`grid md:grid-cols-2 gap-4`). Action row: `CopyButton`, `DownloadButton` (filename switches with mode), `ResetButton`.
- Built `src/components/tools/url-encoder.tsx` → `UrlEncoder`:
  - 4 explicit action buttons: Encode URI (`encodeURI`), Encode Component (`encodeURIComponent`), Decode URI (`decodeURI`), Decode Component (`decodeURIComponent`). Each has an icon (`Globe`/`Braces`/`Link2`/`Unlink`).
  - `try/catch` around the encode/decode calls; failures render `<ErrorMessage>` with `t("errors.generic", {message})`.
  - Same two-column layout + Copy/Download/Reset row.
- Built `src/components/tools/uuid-generator.tsx` → `UuidGenerator`:
  - `generateUuidV4()` prefers `crypto.randomUUID()` when available, falls back to manual v4 using `crypto.getRandomValues` (sets version 0x40 + variant 0x80 + formats to canonical 8-4-4-4-12 hex).
  - `formatUuid()` applies hyphens-strip, uppercase, and `{braces}` based on the three switches (Uppercase / Braces / Hyphens).
  - Count slider (1–100) paired with a numeric `Input` field, both bound to the same `count` state.
  - Output rendered inside `ScrollArea` (`h-[360px]`) as a list of UUIDs with a per-row ghost `CopyButton` (size="icon", `label=""`).
  - Bulk actions: a "Copy all" `Button` that joins UUIDs with `\n` and uses `navigator.clipboard.writeText` (with sonner toast fallback), plus a `DownloadButton` that downloads `uuids.txt`.
  - Empty state rendered inside a dashed-border placeholder when nothing has been generated yet (per spec — does NOT auto-generate on mount).
- Built `src/components/tools/password-generator.tsx` → `PasswordGenerator`:
  - `secureRandomInt(max)` uses `crypto.getRandomValues` + rejection sampling to avoid modulo bias.
  - Builds per-type pools (with ambiguous chars stripped when enabled), guarantees at least one char from each enabled type, then fills the rest from the combined pool and Fisher–Yates shuffles (unbiased).
  - `calcStrength` returns `{score:1..5, entropy}` — entropy = length × log2(poolSize), mapped to 1-5: <28 / <40 / <60 / <80 / ≥80 bits.
  - Auto-seeds one password on first render via `useState(() => generatePassword(DEFAULT_OPTS))` (lazy initializer — avoids the `setState-in-effect` lint rule).
  - 5-segment strength bar (red/orange/yellow/lime/green) + label text (`strengthWeak`..`strengthVeryStrong`) + entropy readout. Disabled-all-categories case is rejected via a guard that bails to `prev` opts and shows a generic toast error.
  - Two-column layout: controls left, password card (shadcn `Card` with `CardContent`, monospace `text-lg`) + strength meter right. Per-card row has a ghost `CopyButton` and a `RefreshCw` icon button for "Regenerate".
- Built `src/components/tools/qr-code.tsx` → `QrCodeGenerator`:
  - Imports `QRCode from "qrcode"` and uses `QRCode.toCanvas(canvas, text, options)` + `QRCode.toString(text, {type:"svg", ...options})`.
  - Shared `qrOptions` built in `useMemo` (errorCorrectionLevel, width, margin 2, color.dark/light).
  - `useEffect` debounces renders by 150ms; all `setState` calls happen inside the `setTimeout` callback (NOT synchronously in the effect body) to satisfy the `react-hooks/set-state-in-effect` rule.
  - Controls: Input for text, Select for size (128/256/512/1024), Select for error correction (L/M/Q/H), two `<input type="color">` pickers for fg/bg.
  - PNG download uses `canvas.toBlob(..., "image/png")` → `URL.createObjectURL` → `<a download>`. SVG download uses the `DownloadButton` with a Blob (`image/svg+xml`).
  - Empty state shown via `<EmptyState icon={QrCodeIcon} />` until the user types text.
- Verified lint: `npx eslint src/components/tools/{base64,url-encoder,uuid-generator,password-generator,qr-code}.tsx` → 0 errors, 0 warnings. (Had to refactor `qr-code.tsx` and `password-generator.tsx` once to satisfy the new `react-hooks/set-state-in-effect` and `react-hooks/exhaustive-deps` rules — fixed by moving state updates inside a `setTimeout` callback and by using a lazy `useState` initializer respectively.)
- Verified types: `npx tsc --noEmit --skipLibCheck` → 0 errors for the 5 new files (the only TS errors in the repo are for pre-existing modules outside this task's scope: `socket.io-client`, `word-counter`, `video-converter`, etc., and the `tool-layout.tsx` `any[]` cast).
- Verified dev log: latest 10 `Module not found` entries in `/home/z/my-project/dev.log` are for tools OUTSIDE this task's scope (`image-cropper`, `image-resizer`, `markdown-previewer`, `regex-tester`, `svg-optimizer`, `text-diff`, `timestamp-converter`, `video-compressor`, `video-converter`, `word-counter`). None of the 5 encoding tools appear in recent errors.
- All 5 files exist with correct named exports (`Base64Tool`, `UrlEncoder`, `UuidGenerator`, `PasswordGenerator`, `QrCodeGenerator`) and `"use client"` directive.

Stage Summary:
- Files created (all under `src/components/tools/`):
  - `base64.tsx` — exports `Base64Tool`
  - `url-encoder.tsx` — exports `UrlEncoder`
  - `uuid-generator.tsx` — exports `UuidGenerator`
  - `password-generator.tsx` — exports `PasswordGenerator`
  - `qr-code.tsx` — exports `QrCodeGenerator`
- Packages installed: `qrcode@1.5.4` (runtime), `@types/qrcode@1.5.6` (dev).
- Key decisions:
  1. Re-used the shared `CopyButton`/`DownloadButton`/`ResetButton`/`ErrorMessage`/`EmptyState` primitives + shadcn UI components (Button, Textarea, Input, Label, Select, Slider, Switch, Tabs, ScrollArea, Card) — no custom UI primitives, no third-party UI libraries beyond `qrcode`.
  2. Consistent two-column responsive layout (`grid md:grid-cols-2 gap-4`) across Base64 / URL / UUID / Password tools.
  3. All user-facing strings go through `t()` (i18n); errors use `errors.generic`/`errors.invalidBase64` with `{message}` interpolation.
  4. Cryptographic randomness throughout: `crypto.randomUUID()`, `crypto.getRandomValues`, rejection sampling for password generation (no modulo bias).
  5. QR generator uses the `qrcode` npm package's `toCanvas` + `toString({type:"svg"})` per the task spec — PNG via canvas `toBlob`, SVG via Blob download.
  6. State management patterns chosen to comply with Next.js 16's strict `react-hooks` ESLint rules: `useState` lazy initializer for password seeding; debounced `setTimeout` callback for QR rendering to avoid synchronous `setState` in effect bodies.
- No issues encountered. All 5 files compile, lint clean, type-check clean, and are wired correctly into the existing router (lines 18–22).
