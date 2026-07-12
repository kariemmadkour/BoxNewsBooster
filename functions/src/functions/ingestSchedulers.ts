import { onSchedule } from "firebase-functions/v2/scheduler";
import { PubSub } from "@google-cloud/pubsub";
import { SourceType } from "../shared/connector";

// One scheduled job per category, each just publishing a trigger message --
// the actual ingestion work happens in the onMessagePublished consumers
// (functions/ingestTriggers.ts). See docs/scheduling-strategy.md for the
// cadence reasoning per category.
let client: PubSub | undefined;
function pubsub(): PubSub {
  if (!client) client = new PubSub();
  return client;
}

async function publishTrigger(topic: string, category: SourceType): Promise<void> {
  await pubsub().topic(topic).publishMessage({ json: { category } });
}

export const triggerRssFetch = onSchedule(
  { schedule: "*/10 * * * *", region: "us-central1", retryCount: 3, minBackoffSeconds: 30, maxBackoffSeconds: 300 },
  async () => {
    await publishTrigger("ingest-trigger-rss", "rss");
  }
);

export const triggerNewsFetch = onSchedule(
  { schedule: "0 */2 * * *", region: "us-central1", retryCount: 3, minBackoffSeconds: 60, maxBackoffSeconds: 600 },
  async () => {
    await publishTrigger("ingest-trigger-news", "news");
  }
);

export const triggerVideoFetch = onSchedule(
  { schedule: "0 */6 * * *", region: "us-central1", retryCount: 2, minBackoffSeconds: 60, maxBackoffSeconds: 600 },
  async () => {
    await publishTrigger("ingest-trigger-video", "video");
  }
);

// Twitter's underlying `sources` doc ships with enabled:false (pay-per-use
// billing mode unconfirmed -- see docs/connector-interface.md) so this
// schedule fires but resolves zero enabled connectors until deliberately
// turned on.
export const triggerSocialFetch = onSchedule(
  { schedule: "*/30 * * * *", region: "us-central1", retryCount: 3, minBackoffSeconds: 60, maxBackoffSeconds: 600 },
  async () => {
    await publishTrigger("ingest-trigger-social", "social");
  }
);
