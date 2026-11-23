"use client";

import { Suspense, lazy } from "react";
import { useAppStore } from "@/store/use-app-store";
import { getToolBySlug } from "@/data/tools";
import { ToolLayout } from "@/components/tool/tool-layout";
import { LoadingState } from "@/components/tool/states";
import { Home } from "@/components/home/home";

// Lazy-load all tool components so heavy libs (FFmpeg, image manipulation, etc.)
// are only loaded when the user actually opens the tool.
const toolComponents: Record<string, React.LazyExoticComponent<React.ComponentType<Record<string, never>>>> = {
  "json-formatter": lazy(() => import("@/components/tools/json-formatter").then((m) => ({ default: m.JsonFormatter }))),
  "code-formatter": lazy(() => import("@/components/tools/code-formatter").then((m) => ({ default: m.CodeFormatter }))),
  "html-formatter": lazy(() => import("@/components/tools/html-formatter").then((m) => ({ default: m.HtmlFormatter }))),
  "css-formatter": lazy(() => import("@/components/tools/css-formatter").then((m) => ({ default: m.CssFormatter }))),
  "javascript-formatter": lazy(() => import("@/components/tools/javascript-formatter").then((m) => ({ default: m.JavascriptFormatter }))),
  base64: lazy(() => import("@/components/tools/base64").then((m) => ({ default: m.Base64Tool }))),
  "url-encoder": lazy(() => import("@/components/tools/url-encoder").then((m) => ({ default: m.UrlEncoder }))),
  "uuid-generator": lazy(() => import("@/components/tools/uuid-generator").then((m) => ({ default: m.UuidGenerator }))),
  "password-generator": lazy(() => import("@/components/tools/password-generator").then((m) => ({ default: m.PasswordGenerator }))),
  "qr-code": lazy(() => import("@/components/tools/qr-code").then((m) => ({ default: m.QrCodeGenerator }))),
  "markdown-previewer": lazy(() => import("@/components/tools/markdown-previewer").then((m) => ({ default: m.MarkdownPreviewer }))),
  "regex-tester": lazy(() => import("@/components/tools/regex-tester").then((m) => ({ default: m.RegexTester }))),
  "text-diff": lazy(() => import("@/components/tools/text-diff").then((m) => ({ default: m.TextDiff }))),
  "word-counter": lazy(() => import("@/components/tools/word-counter").then((m) => ({ default: m.WordCounter }))),
  "case-converter": lazy(() => import("@/components/tools/case-converter").then((m) => ({ default: m.CaseConverter }))),
  "image-compressor": lazy(() => import("@/components/tools/image-compressor").then((m) => ({ default: m.ImageCompressor }))),
  "image-resizer": lazy(() => import("@/components/tools/image-resizer").then((m) => ({ default: m.ImageResizer }))),
  "image-cropper": lazy(() => import("@/components/tools/image-cropper").then((m) => ({ default: m.ImageCropper }))),
  "image-converter": lazy(() => import("@/components/tools/image-converter").then((m) => ({ default: m.ImageConverter }))),
  "svg-optimizer": lazy(() => import("@/components/tools/svg-optimizer").then((m) => ({ default: m.SvgOptimizer }))),
  "color-converter": lazy(() => import("@/components/tools/color-converter").then((m) => ({ default: m.ColorConverter }))),
  "timestamp-converter": lazy(() => import("@/components/tools/timestamp-converter").then((m) => ({ default: m.TimestampConverter }))),
  "video-converter": lazy(() => import("@/components/tools/video-converter").then((m) => ({ default: m.VideoConverter }))),
  "video-compressor": lazy(() => import("@/components/tools/video-compressor").then((m) => ({ default: m.VideoCompressor }))),
  "audio-converter": lazy(() => import("@/components/tools/audio-converter").then((m) => ({ default: m.AudioConverter }))),
  "tiktok-date-extractor": lazy(() => import("@/components/tools/tiktok-date-extractor").then((m) => ({ default: m.TikTokDateExtractor }))),
};

export function Router() {
  const { route } = useAppStore();

  if (route.name === "tool") {
    const slug = route.slug;
    const tool = getToolBySlug(slug);
    if (!tool) {
      return <Home />;
    }
    const ToolComponent = toolComponents[slug];
    if (!ToolComponent) {
      return <Home />;
    }
    return (
      <ToolLayout slug={slug}>
        <Suspense fallback={<LoadingState />}>
          <ToolComponent />
        </Suspense>
      </ToolLayout>
    );
  }

  // Home or category view
  return <Home />;
}
