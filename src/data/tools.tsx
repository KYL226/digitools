import type { LucideIcon } from "lucide-react";
import {
  Braces,
  Code2,
  FileCode2,
  Palette,
  FileJson,
  Binary,
  Link2,
  Fingerprint,
  KeyRound,
  QrCode,
  FileText,
  Regex,
  GitCompare,
  Type,
  CaseSensitive,
  Image as ImageIcon,
  Crop,
  Maximize2,
  RefreshCw,
  FileImage,
  Minimize2,
  Pipette,
  Clock,
  Film,
  Video,
  Music,
  CalendarDays,
} from "lucide-react";

export type ToolCategory =
  | "developer"
  | "text"
  | "encoding"
  | "image"
  | "design"
  | "media";

export interface ToolMeta {
  slug: string;
  category: ToolCategory;
  icon: LucideIcon;
  // Translation key prefix: tools.<slug>
  i18nKey: string;
  // For search (uses i18n keys but also extra aliases)
  aliases?: string[];
  keywords?: string[];
  // Lazy-loaded component path
  component: string;
}

export const TOOLS: ToolMeta[] = [
  // Developer Tools
  {
    slug: "json-formatter",
    category: "developer",
    icon: Braces,
    i18nKey: "tools.json-formatter",
    component: "./tools/json-formatter",
    aliases: ["json", "beautify", "validator", "parse"],
    keywords: ["json", "format", "validate", "beautify", "minify"],
  },
  {
    slug: "code-formatter",
    category: "developer",
    icon: Code2,
    i18nKey: "tools.code-formatter",
    component: "./tools/code-formatter",
    aliases: ["prettier", "beautify", "source"],
    keywords: ["code", "format", "prettify"],
  },
  {
    slug: "html-formatter",
    category: "developer",
    icon: FileCode2,
    i18nKey: "tools.html-formatter",
    component: "./tools/html-formatter",
    aliases: ["html", "markup"],
    keywords: ["html", "format", "indent", "prettify"],
  },
  {
    slug: "css-formatter",
    category: "developer",
    icon: Palette,
    i18nKey: "tools.css-formatter",
    component: "./tools/css-formatter",
    aliases: ["css", "stylesheet"],
    keywords: ["css", "beautify", "minify", "format"],
  },
  {
    slug: "javascript-formatter",
    category: "developer",
    icon: FileJson,
    i18nKey: "tools.javascript-formatter",
    component: "./tools/javascript-formatter",
    aliases: ["js", "ecmascript", "es6"],
    keywords: ["javascript", "js", "format", "beautify"],
  },
  // Encoding & Generators
  {
    slug: "base64",
    category: "encoding",
    icon: Binary,
    i18nKey: "tools.base64",
    component: "./tools/base64",
    aliases: ["base64", "encode", "decode"],
    keywords: ["base64", "encode", "decode", "atob", "btoa"],
  },
  {
    slug: "url-encoder",
    category: "encoding",
    icon: Link2,
    i18nKey: "tools.url-encoder",
    component: "./tools/url-encoder",
    aliases: ["url", "uri", "percent"],
    keywords: ["url", "uri", "encode", "decode", "percent"],
  },
  {
    slug: "uuid-generator",
    category: "encoding",
    icon: Fingerprint,
    i18nKey: "tools.uuid-generator",
    component: "./tools/uuid-generator",
    aliases: ["uuid", "guid", "id"],
    keywords: ["uuid", "guid", "generate", "identifier"],
  },
  {
    slug: "password-generator",
    category: "encoding",
    icon: KeyRound,
    i18nKey: "tools.password-generator",
    component: "./tools/password-generator",
    aliases: ["password", "pass", "secure"],
    keywords: ["password", "generate", "secure", "random"],
  },
  {
    slug: "qr-code",
    category: "encoding",
    icon: QrCode,
    i18nKey: "tools.qr-code",
    component: "./tools/qr-code",
    aliases: ["qr", "qrcode", "code"],
    keywords: ["qr", "code", "generate", "barcode"],
  },
  // Text Tools
  {
    slug: "markdown-previewer",
    category: "text",
    icon: FileText,
    i18nKey: "tools.markdown-previewer",
    component: "./tools/markdown-previewer",
    aliases: ["markdown", "md", "preview"],
    keywords: ["markdown", "preview", "render", "html"],
  },
  {
    slug: "regex-tester",
    category: "text",
    icon: Regex,
    i18nKey: "tools.regex-tester",
    component: "./tools/regex-tester",
    aliases: ["regex", "regexp", "pattern"],
    keywords: ["regex", "regexp", "test", "pattern", "match"],
  },
  {
    slug: "text-diff",
    category: "text",
    icon: GitCompare,
    i18nKey: "tools.text-diff",
    component: "./tools/text-diff",
    aliases: ["diff", "compare", "difference"],
    keywords: ["diff", "compare", "text", "difference"],
  },
  {
    slug: "word-counter",
    category: "text",
    icon: Type,
    i18nKey: "tools.word-counter",
    component: "./tools/word-counter",
    aliases: ["count", "words", "characters"],
    keywords: ["word", "count", "character", "stats"],
  },
  {
    slug: "case-converter",
    category: "text",
    icon: CaseSensitive,
    i18nKey: "tools.case-converter",
    component: "./tools/case-converter",
    aliases: ["case", "casing", "uppercase", "lowercase"],
    keywords: ["case", "convert", "uppercase", "lowercase", "camel", "snake", "kebab"],
  },
  // Image Tools
  {
    slug: "image-compressor",
    category: "image",
    icon: Minimize2,
    i18nKey: "tools.image-compressor",
    component: "./tools/image-compressor",
    aliases: ["compress", "image", "optimize"],
    keywords: ["image", "compress", "optimize", "reduce"],
  },
  {
    slug: "image-resizer",
    category: "image",
    icon: Maximize2,
    i18nKey: "tools.image-resizer",
    component: "./tools/image-resizer",
    aliases: ["resize", "image", "scale"],
    keywords: ["image", "resize", "scale", "dimensions"],
  },
  {
    slug: "image-cropper",
    category: "image",
    icon: Crop,
    i18nKey: "tools.image-cropper",
    component: "./tools/image-cropper",
    aliases: ["crop", "image"],
    keywords: ["image", "crop", "cut", "trim"],
  },
  {
    slug: "image-converter",
    category: "image",
    icon: RefreshCw,
    i18nKey: "tools.image-converter",
    component: "./tools/image-converter",
    aliases: ["convert", "image", "format"],
    keywords: ["image", "convert", "png", "jpg", "webp"],
  },
  {
    slug: "svg-optimizer",
    category: "image",
    icon: FileImage,
    i18nKey: "tools.svg-optimizer",
    component: "./tools/svg-optimizer",
    aliases: ["svg", "optimize"],
    keywords: ["svg", "optimize", "minify", "clean"],
  },
  // Design & Utility
  {
    slug: "color-converter",
    category: "design",
    icon: Pipette,
    i18nKey: "tools.color-converter",
    component: "./tools/color-converter",
    aliases: ["color", "hex", "rgb", "hsl"],
    keywords: ["color", "hex", "rgb", "hsl", "picker", "convert"],
  },
  {
    slug: "timestamp-converter",
    category: "design",
    icon: Clock,
    i18nKey: "tools.timestamp-converter",
    component: "./tools/timestamp-converter",
    aliases: ["timestamp", "unix", "epoch", "date"],
    keywords: ["timestamp", "unix", "epoch", "date", "convert"],
  },
  // Media Tools
  {
    slug: "video-converter",
    category: "media",
    icon: Film,
    i18nKey: "tools.video-converter",
    component: "./tools/video-converter",
    aliases: ["video", "convert"],
    keywords: ["video", "convert", "ffmpeg", "mp4", "webm"],
  },
  {
    slug: "video-compressor",
    category: "media",
    icon: Video,
    i18nKey: "tools.video-compressor",
    component: "./tools/video-compressor",
    aliases: ["video", "compress"],
    keywords: ["video", "compress", "ffmpeg", "reduce"],
  },
  {
    slug: "audio-converter",
    category: "media",
    icon: Music,
    i18nKey: "tools.audio-converter",
    component: "./tools/audio-converter",
    aliases: ["audio", "convert", "mp3"],
    keywords: ["audio", "convert", "mp3", "wav", "ogg"],
  },
  {
    slug: "tiktok-date-extractor",
    category: "media",
    icon: CalendarDays,
    i18nKey: "tools.tiktok-date-extractor",
    component: "./tools/tiktok-date-extractor",
    aliases: ["tiktok", "date", "extract", "timestamp"],
    keywords: ["tiktok", "date", "extract", "video", "id", "timestamp", "publication"],
  },
];

export const CATEGORIES: { id: ToolCategory; icon: LucideIcon }[] = [
  { id: "developer", icon: Code2 },
  { id: "encoding", icon: Binary },
  { id: "text", icon: FileText },
  { id: "image", icon: ImageIcon },
  { id: "design", icon: Pipette },
  { id: "media", icon: Film },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return TOOLS.filter((t) => t.category === category);
}
