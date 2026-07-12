// Shared contract every external source connector implements.
// See docs/connector-interface.md for the rationale and per-source notes.
//
// Phase 1: interface only. No connector implementations yet -- those land
// in functions/src/connectors/ in Phase 2 (see docs/folder-structure.md).

export type SourceType =
  | "news"
  | "rss"
  | "government"
  | "trends"
  | "social"
  | "financial"
  | "sports"
  // Added beyond the original spec: YouTube content isn't "social" (no
  // follow graph / retweet-style virality) and doesn't fit any other
  // bucket -- see docs/connector-interface.md for why this was added.
  | "video";

export interface NormalizedItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  publishedAt: string; // ISO8601
  author?: string;
  publisher: string;
  country: string;
  language: string;
  category?: string;
  image?: string;
  tags?: string[];
  entities?: string[];
  sourceType: SourceType;
}

export interface ConnectorHealth {
  healthy: boolean;
  message?: string;
}

export interface IConnector {
  id: string;
  fetch(): Promise<unknown[]>;
  normalize(raw: unknown[]): NormalizedItem[];
  validate(item: NormalizedItem): boolean;
  healthCheck(): Promise<ConnectorHealth>;
}
