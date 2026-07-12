import { ConnectorId } from "../config/connectors";
import { IConnector } from "../shared/connector";
import { gnewsConnector } from "./gnews";
import { googleNewsRssConnector } from "./googleNewsRss";
import { newsapiConnector } from "./newsapi";
import { twitterXConnector } from "./twitterX";
import { youtubeConnector } from "./youtube";

// Populated incrementally as each connector lands (Tier 2a-2d). Connectors
// not yet built throw "unimplemented" rather than being omitted, so
// ConnectorManager's Record<ConnectorId, IConnector> stays type-complete
// throughout the build instead of breaking tsc between tiers.
function notImplemented(id: ConnectorId): IConnector {
  return {
    id,
    async fetch() {
      throw new Error(`Connector "${id}" is not implemented yet.`);
    },
    normalize() {
      return [];
    },
    validate() {
      return false;
    },
    async healthCheck() {
      return { healthy: false, message: `Connector "${id}" is not implemented yet.` };
    },
  };
}

const CONNECTORS: Record<ConnectorId, IConnector> = {
  newsapi: newsapiConnector,
  gnews: gnewsConnector,
  googlenewsrss: googleNewsRssConnector,
  youtube: youtubeConnector,
  twitterx: twitterXConnector,
};

export function getConnector(id: ConnectorId): IConnector {
  return CONNECTORS[id];
}
