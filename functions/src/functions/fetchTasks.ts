import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { GNEWS_API_KEY, NEWS_API_KEY, TWITTER_BEARER_TOKEN, YOUTUBE_API_KEY } from "../config/secrets";
import { CONNECTOR_TASK_CONFIG } from "../config/connectors";
import { runConnectorFetch } from "../services/ingestion";

// One onTaskDispatched per connector -- each does the actual fetch() ->
// normalize() -> validate() -> publish() -> health-record sequence for
// that connector, with per-connector retry/rate-limit config. Enqueued by
// services/ingestion.ts#runCategoryIngestion via
// getFunctions().taskQueue(name).enqueue({}). See docs/queue-strategy.md.

export const fetchNewsapiTask = onTaskDispatched(
  {
    region: "us-central1",
    secrets: [NEWS_API_KEY],
    retryConfig: {
      maxAttempts: CONNECTOR_TASK_CONFIG.newsapi.maxAttempts,
      maxBackoffSeconds: CONNECTOR_TASK_CONFIG.newsapi.maxBackoffSeconds,
    },
    rateLimits: { maxDispatchesPerSecond: CONNECTOR_TASK_CONFIG.newsapi.maxDispatchesPerSecond },
  },
  async () => {
    await runConnectorFetch("newsapi");
  }
);

export const fetchGnewsTask = onTaskDispatched(
  {
    region: "us-central1",
    secrets: [GNEWS_API_KEY],
    retryConfig: {
      maxAttempts: CONNECTOR_TASK_CONFIG.gnews.maxAttempts,
      maxBackoffSeconds: CONNECTOR_TASK_CONFIG.gnews.maxBackoffSeconds,
    },
    rateLimits: { maxDispatchesPerSecond: CONNECTOR_TASK_CONFIG.gnews.maxDispatchesPerSecond },
  },
  async () => {
    await runConnectorFetch("gnews");
  }
);

export const fetchGoogleNewsRssTask = onTaskDispatched(
  {
    region: "us-central1",
    retryConfig: {
      maxAttempts: CONNECTOR_TASK_CONFIG.googlenewsrss.maxAttempts,
      maxBackoffSeconds: CONNECTOR_TASK_CONFIG.googlenewsrss.maxBackoffSeconds,
    },
    rateLimits: { maxDispatchesPerSecond: CONNECTOR_TASK_CONFIG.googlenewsrss.maxDispatchesPerSecond },
  },
  async () => {
    await runConnectorFetch("googlenewsrss");
  }
);

export const fetchYoutubeTask = onTaskDispatched(
  {
    region: "us-central1",
    secrets: [YOUTUBE_API_KEY],
    retryConfig: {
      maxAttempts: CONNECTOR_TASK_CONFIG.youtube.maxAttempts,
      maxBackoffSeconds: CONNECTOR_TASK_CONFIG.youtube.maxBackoffSeconds,
    },
    rateLimits: { maxDispatchesPerSecond: CONNECTOR_TASK_CONFIG.youtube.maxDispatchesPerSecond },
  },
  async () => {
    await runConnectorFetch("youtube");
  }
);

export const fetchTwitterXTask = onTaskDispatched(
  {
    region: "us-central1",
    secrets: [TWITTER_BEARER_TOKEN],
    retryConfig: {
      maxAttempts: CONNECTOR_TASK_CONFIG.twitterx.maxAttempts,
      maxBackoffSeconds: CONNECTOR_TASK_CONFIG.twitterx.maxBackoffSeconds,
    },
    rateLimits: { maxDispatchesPerSecond: CONNECTOR_TASK_CONFIG.twitterx.maxDispatchesPerSecond },
  },
  async () => {
    await runConnectorFetch("twitterx");
  }
);
