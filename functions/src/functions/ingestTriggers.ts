import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { runCategoryIngestion } from "../services/ingestion";
import { SourceType } from "../shared/connector";

// Consumes the 4 trigger topics published by ingestSchedulers.ts. `retry:
// false` -- real retry/backoff is handled at the Cloud Tasks layer
// (functions/fetchTasks.ts's retryConfig), not here; firebase-functions v2's
// Pub/Sub trigger only exposes a boolean retry flag, no backoff tuning.
export const onRssIngestTrigger = onMessagePublished(
  { topic: "ingest-trigger-rss", region: "us-central1", retry: false },
  async (event) => {
    await runCategoryIngestion(event.data.message.json.category as SourceType);
  }
);

export const onNewsIngestTrigger = onMessagePublished(
  { topic: "ingest-trigger-news", region: "us-central1", retry: false },
  async (event) => {
    await runCategoryIngestion(event.data.message.json.category as SourceType);
  }
);

export const onVideoIngestTrigger = onMessagePublished(
  { topic: "ingest-trigger-video", region: "us-central1", retry: false },
  async (event) => {
    await runCategoryIngestion(event.data.message.json.category as SourceType);
  }
);

export const onSocialIngestTrigger = onMessagePublished(
  { topic: "ingest-trigger-social", region: "us-central1", retry: false },
  async (event) => {
    await runCategoryIngestion(event.data.message.json.category as SourceType);
  }
);
