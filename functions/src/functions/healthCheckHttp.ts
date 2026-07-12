import { onRequest } from "firebase-functions/v2/https";
import { ALL_CONNECTOR_IDS, ConnectorId } from "../config/connectors";
import { ANTHROPIC_API_KEY, GNEWS_API_KEY, NEWS_API_KEY, TWITTER_BEARER_TOKEN, YOUTUBE_API_KEY } from "../config/secrets";
import { requireRole } from "../lib/authz";
import { runConnectorHealthCheck } from "../services/ingestion";
import { getConnector } from "../connectors/index";

// Admin-only: GET ?connectorId=googlenewsrss runs that connector's
// healthCheck() and records + returns the result. Gated behind an admin/
// editor custom claim since some connectors' health checks are billed
// (Twitter, YouTube quota) -- see docs/connector-interface.md.
export const healthCheckHttp = onRequest(
  {
    region: "us-central1",
    secrets: [NEWS_API_KEY, GNEWS_API_KEY, YOUTUBE_API_KEY, TWITTER_BEARER_TOKEN, ANTHROPIC_API_KEY],
  },
  async (req, res) => {
    const authz = await requireRole(req, res, ["admin", "editor"]);
    if (!authz) return;

    const connectorId = req.query.connectorId as string | undefined;
    if (!connectorId || !ALL_CONNECTOR_IDS.includes(connectorId as ConnectorId)) {
      res.status(400).json({ error: `connectorId must be one of: ${ALL_CONNECTOR_IDS.join(", ")}` });
      return;
    }

    try {
      await runConnectorHealthCheck(connectorId as ConnectorId);
      const health = await getConnector(connectorId as ConnectorId).healthCheck();
      res.status(200).json(health);
    } catch (error) {
      res.status(500).json({ healthy: false, message: error instanceof Error ? error.message : String(error) });
    }
  }
);
