// Per-connector operational constants: retry/backoff for the Cloud Tasks
// queue each connector's fetch task runs on, and dispatch rate limits.
// Named "connectors.ts", not "sources.ts", to avoid colliding in meaning
// with the Firestore "sources" collection -- see docs/folder-structure.md.

export type ConnectorId = "newsapi" | "gnews" | "googlenewsrss" | "youtube" | "twitterx";

export const ALL_CONNECTOR_IDS: ConnectorId[] = ["newsapi", "gnews", "googlenewsrss", "youtube", "twitterx"];

export interface ConnectorTaskConfig {
  maxAttempts: number;
  maxBackoffSeconds: number;
  maxDispatchesPerSecond: number;
}

export const CONNECTOR_TASK_CONFIG: Record<ConnectorId, ConnectorTaskConfig> = {
  googlenewsrss: { maxAttempts: 5, maxBackoffSeconds: 600, maxDispatchesPerSecond: 5 },
  newsapi: { maxAttempts: 3, maxBackoffSeconds: 3600, maxDispatchesPerSecond: 1 },
  gnews: { maxAttempts: 3, maxBackoffSeconds: 3600, maxDispatchesPerSecond: 1 },
  youtube: { maxAttempts: 2, maxBackoffSeconds: 7200, maxDispatchesPerSecond: 1 },
  twitterx: { maxAttempts: 3, maxBackoffSeconds: 3600, maxDispatchesPerSecond: 1 },
};

// Auto-disable a source after this many consecutive healthCheck/fetch
// failures (see lib/sourceRegistry.ts#incrementFailureAndMaybeDisable).
export const MAX_CONSECUTIVE_FAILURES = 5;
