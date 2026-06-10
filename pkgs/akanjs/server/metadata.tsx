import type { AkanMetadata, Head, ResolvedHead, ResolveHeadResult } from "akanjs/client";
import type { ReactNode } from "react";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function renderOpenGraph(metadata: AkanMetadata): ReactNode[] {
  const openGraph = metadata.openGraph;
  if (!openGraph) return [];
  const nodes: ReactNode[] = [];
  if (openGraph.title) nodes.push(<meta key="og:title" property="og:title" content={openGraph.title} />);
  if (openGraph.description)
    nodes.push(<meta key="og:description" property="og:description" content={openGraph.description} />);
  if (openGraph.type) nodes.push(<meta key="og:type" property="og:type" content={openGraph.type} />);
  if (openGraph.url) nodes.push(<meta key="og:url" property="og:url" content={openGraph.url} />);
  if (openGraph.siteName) nodes.push(<meta key="og:site_name" property="og:site_name" content={openGraph.siteName} />);
  for (const [index, image] of normalizeStringArray(openGraph.images).entries()) {
    nodes.push(<meta key={`og:image:${index}`} property="og:image" content={image} />);
  }
  return nodes;
}

function renderTwitter(metadata: AkanMetadata): ReactNode[] {
  const twitter = metadata.twitter;
  if (!twitter) return [];
  const nodes: ReactNode[] = [];
  if (twitter.card) nodes.push(<meta key="twitter:card" name="twitter:card" content={twitter.card} />);
  if (twitter.title) nodes.push(<meta key="twitter:title" name="twitter:title" content={twitter.title} />);
  if (twitter.description)
    nodes.push(<meta key="twitter:description" name="twitter:description" content={twitter.description} />);
  for (const [index, image] of normalizeStringArray(twitter.images).entries()) {
    nodes.push(<meta key={`twitter:image:${index}`} name="twitter:image" content={image} />);
  }
  return nodes;
}

function renderAlternates(metadata: AkanMetadata): ReactNode[] {
  const alternates = metadata.alternates;
  if (!alternates) return [];
  const nodes: ReactNode[] = [];
  if (alternates.canonical) nodes.push(<link key="canonical" rel="canonical" href={alternates.canonical} />);
  if (alternates.languages) {
    for (const [lang, href] of Object.entries(alternates.languages)) {
      nodes.push(<link key={`metadata:alternate:${lang}`} rel="alternate" hrefLang={lang} href={href} />);
    }
  }
  return nodes;
}

export function isAkanMetadata(value: unknown): value is AkanMetadata {
  if (!isRecord(value)) return false;
  return (
    "title" in value ||
    "description" in value ||
    "robots" in value ||
    "openGraph" in value ||
    "twitter" in value ||
    "alternates" in value
  );
}

export function renderMetadata(metadata: AkanMetadata): Head {
  return (
    <>
      {metadata.title ? <title>{metadata.title}</title> : null}
      {metadata.description ? <meta name="description" content={metadata.description} /> : null}
      {metadata.robots ? <meta name="robots" content={metadata.robots} /> : null}
      {renderOpenGraph(metadata)}
      {renderTwitter(metadata)}
      {renderAlternates(metadata)}
    </>
  );
}

export function hasExplicitLanguageAlternates(metadata: AkanMetadata | null | undefined): boolean {
  return Boolean(metadata?.alternates?.languages && Object.keys(metadata.alternates.languages).length > 0);
}

export function shouldRenderLocaleAlternates(options: {
  isSpecialRoute?: boolean;
  hasExplicitLanguageAlternates?: boolean;
}): boolean {
  return options.isSpecialRoute !== true && options.hasExplicitLanguageAlternates !== true;
}

export function isResolvedHead(value: unknown): value is ResolvedHead {
  return isRecord(value) && "node" in value && "hasExplicitLanguageAlternates" in value;
}

export function resolveMetadataHead(metadata: AkanMetadata): ResolvedHead {
  return {
    node: renderMetadata(metadata),
    hasExplicitLanguageAlternates: hasExplicitLanguageAlternates(metadata),
  };
}

export function resolveHeadExport(value: Head | AkanMetadata | null | undefined): ResolvedHead {
  return isAkanMetadata(value) ? resolveMetadataHead(value) : { node: value, hasExplicitLanguageAlternates: false };
}

export function resolveHeadResult(value: ResolveHeadResult): ResolvedHead {
  if (isResolvedHead(value)) return value;
  return resolveHeadExport(value as Head | AkanMetadata | null | undefined);
}

export function normalizeHead(value: Head | AkanMetadata | null | undefined): Head | null | undefined {
  return isAkanMetadata(value) ? renderMetadata(value) : value;
}
