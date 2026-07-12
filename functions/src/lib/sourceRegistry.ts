import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { ConnectorId, MAX_CONSECUTIVE_FAILURES } from "../config/connectors";
import { ConnectorHealth, SourceType } from "../shared/connector";

export interface SourceDoc {
  id: string;
  name: string;
  connectorId: ConnectorId;
  country: string | null;
  language: string | null;
  type: SourceType;
  priority: number;
  category: string | null;
  query: string | null;
  rss: string | null;
  enabled: boolean;
}

function db() {
  return getFirestore();
}

export async function getEnabledSourcesByConnector(connectorId: ConnectorId): Promise<SourceDoc[]> {
  const snap = await db()
    .collection("sources")
    .where("connectorId", "==", connectorId)
    .where("enabled", "==", true)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SourceDoc);
}

export async function getEnabledConnectorIdsForType(type: SourceType): Promise<ConnectorId[]> {
  const snap = await db().collection("sources").where("type", "==", type).where("enabled", "==", true).get();
  const ids = new Set<ConnectorId>();
  snap.docs.forEach((d) => ids.add(d.data().connectorId as ConnectorId));
  return [...ids];
}

// A healthCheck()/fetch() failure is connector-level (IConnector has one
// healthCheck() per connector), but a connector can have multiple `sources`
// docs (e.g. newsapi has one per country/category combo). These fan the
// health/failure update out to every source doc for that connector rather
// than assuming a 1:1 connectorId<->sourceId mapping.
async function getSourceIdsForConnector(connectorId: ConnectorId): Promise<string[]> {
  const snap = await db().collection("sources").where("connectorId", "==", connectorId).get();
  return snap.docs.map((d) => d.id);
}

export async function recordHealthCheck(connectorId: ConnectorId, health: ConnectorHealth): Promise<void> {
  const sourceIds = await getSourceIdsForConnector(connectorId);
  const batch = db().batch();
  for (const sourceId of sourceIds) {
    batch.set(
      db().collection("sources").doc(sourceId),
      {
        lastHealthCheck: { healthy: health.healthy, message: health.message ?? null, checkedAt: Timestamp.now() },
        ...(health.healthy ? { consecutiveFailures: 0 } : {}),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  }
  await batch.commit();
}

// Increments the failure counter and auto-disables each source doc for
// this connector once it crosses MAX_CONSECUTIVE_FAILURES -- called on
// both fetch() errors and failed healthCheck()s. See docs/scheduling-strategy.md.
export async function incrementFailureAndMaybeDisable(connectorId: ConnectorId): Promise<void> {
  const sourceIds = await getSourceIdsForConnector(connectorId);
  await db().runTransaction(async (tx) => {
    for (const sourceId of sourceIds) {
      const ref = db().collection("sources").doc(sourceId);
      const snap = await tx.get(ref);
      if (!snap.exists) continue;
      const current = (snap.data()?.consecutiveFailures as number | undefined) ?? 0;
      const next = current + 1;
      tx.set(
        ref,
        {
          consecutiveFailures: next,
          ...(next >= MAX_CONSECUTIVE_FAILURES ? { enabled: false } : {}),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    }
  });
}
