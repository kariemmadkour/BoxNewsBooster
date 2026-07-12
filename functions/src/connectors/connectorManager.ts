import { ConnectorId } from "../config/connectors";
import { getEnabledConnectorIdsForType } from "../lib/sourceRegistry";
import { IConnector, SourceType } from "../shared/connector";
import { getConnector } from "./index";

// Resolves which connectors have at least one enabled source in a given
// category, and returns their IConnector instances. Each connector's own
// fetch() queries its own enabled `sources` docs internally (IConnector.fetch()
// takes no params per the committed Phase 1 interface) -- this manager's only
// job is figuring out WHICH connectors to invoke for a scheduled category run.
export async function getConnectorsForCategory(category: SourceType): Promise<IConnector[]> {
  const connectorIds = await getEnabledConnectorIdsForType(category);
  return connectorIds.map((id: ConnectorId) => getConnector(id));
}
