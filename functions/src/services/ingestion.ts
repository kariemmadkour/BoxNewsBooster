import { getFunctions } from "firebase-admin/functions";
import { logger } from "firebase-functions/v2";
import { getConnectorsForCategory } from "../connectors/connectorManager";
import { getConnector } from "../connectors/index";
import { ConnectorId } from "../config/connectors";
import { incrementFailureAndMaybeDisable, recordHealthCheck } from "../lib/sourceRegistry";
import { publishNormalizedItems } from "../lib/pubsubPublisher";
import { SourceType } from "../shared/connector";

// Maps each connectorId to the deployed Cloud Tasks queue function name
// (see functions/fetchTasks.ts). Kept here, not in config/connectors.ts,
// since it's specifically about task-queue dispatch, not general connector config.
const TASK_QUEUE_FUNCTION: Record<ConnectorId, string> = {
  newsapi: "fetchNewsapiTask",
  gnews: "fetchGnewsTask",
  googlenewsrss: "fetchGoogleNewsRssTask",
  youtube: "fetchYoutubeTask",
  twitterx: "fetchTwitterXTask",
};

// Called by the Pub/Sub-triggered onMessagePublished handlers
// (functions/ingestTriggers.ts) -- resolves which connectors are enabled
// for this category and enqueues one Cloud Task per connector.
export async function runCategoryIngestion(category: SourceType): Promise<void> {
  const connectors = await getConnectorsForCategory(category);
  logger.info("runCategoryIngestion", { category, connectorCount: connectors.length });

  await Promise.all(
    connectors.map((connector) =>
      getFunctions()
        .taskQueue(TASK_QUEUE_FUNCTION[connector.id as ConnectorId])
        .enqueue({})
    )
  );
}

// Called by each connector's onTaskDispatched handler
// (functions/fetchTasks.ts) -- runs the actual fetch -> normalize ->
// validate -> publish -> health-record sequence for one connector.
export async function runConnectorFetch(connectorId: ConnectorId): Promise<void> {
  const connector = getConnector(connectorId);

  try {
    const raw = await connector.fetch();
    const normalized = connector.normalize(raw);
    const valid = normalized.filter((item) => connector.validate(item));

    await publishNormalizedItems(connectorId, valid);

    logger.info("runConnectorFetch succeeded", {
      connectorId,
      rawCount: raw.length,
      normalizedCount: normalized.length,
      validCount: valid.length,
    });
  } catch (error) {
    logger.error("runConnectorFetch failed", {
      connectorId,
      errorDetail: error instanceof Error ? error.message : String(error),
    });
    await incrementFailureAndMaybeDisable(connectorId);
    throw error; // let onTaskDispatched's retryConfig handle retries
  }
}

// Runs one connector's healthCheck() and records the result against its
// `sources` doc(s). Used by the admin health-check endpoint and the hourly
// health-monitor sweep.
export async function runConnectorHealthCheck(connectorId: ConnectorId): Promise<void> {
  const connector = getConnector(connectorId);
  const health = await connector.healthCheck();
  await recordHealthCheck(connectorId, health);
  if (!health.healthy) {
    await incrementFailureAndMaybeDisable(connectorId);
  }
}
