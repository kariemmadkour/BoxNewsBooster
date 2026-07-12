import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { ALL_CONNECTOR_IDS } from "../config/connectors";
import { ANTHROPIC_API_KEY, GNEWS_API_KEY, NEWS_API_KEY, TWITTER_BEARER_TOKEN, YOUTUBE_API_KEY } from "../config/secrets";
import { getEnabledSourcesByConnector } from "../lib/sourceRegistry";
import { runConnectorHealthCheck } from "../services/ingestion";

// Hourly sweep. Skips any connector with zero enabled `sources` docs --
// this is what keeps Twitter's real per-call billing from firing
// automatically while its source ships disabled (see
// docs/connector-interface.md); it starts getting checked the moment its
// source is turned on, with no code change needed.
export const healthMonitorSweep = onSchedule(
  {
    schedule: "0 * * * *",
    region: "us-central1",
    secrets: [NEWS_API_KEY, GNEWS_API_KEY, YOUTUBE_API_KEY, TWITTER_BEARER_TOKEN, ANTHROPIC_API_KEY],
  },
  async () => {
    for (const connectorId of ALL_CONNECTOR_IDS) {
      const enabledSources = await getEnabledSourcesByConnector(connectorId);
      if (enabledSources.length === 0) {
        logger.info("healthMonitorSweep: skipping (no enabled sources)", { connectorId });
        continue;
      }
      try {
        await runConnectorHealthCheck(connectorId);
      } catch (error) {
        logger.error("healthMonitorSweep: health check threw", {
          connectorId,
          errorDetail: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
);
