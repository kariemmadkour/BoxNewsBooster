import { PubSub } from "@google-cloud/pubsub";
import { ConnectorId } from "../config/connectors";
import { NormalizedItem } from "../shared/connector";

export const RAW_ARTICLES_TOPIC = "raw-articles";

let client: PubSub | undefined;
function pubsub(): PubSub {
  if (!client) client = new PubSub();
  return client;
}

// One message per NormalizedItem, with {sourceType, connectorId} as message
// attributes so downstream consumers can filter without deserializing every
// message body. See docs/architecture.md.
export async function publishNormalizedItems(connectorId: ConnectorId, items: NormalizedItem[]): Promise<void> {
  if (items.length === 0) return;

  const topic = pubsub().topic(RAW_ARTICLES_TOPIC);
  await Promise.all(
    items.map((item) =>
      topic.publishMessage({
        json: item,
        attributes: { sourceType: item.sourceType, connectorId },
      })
    )
  );
}
