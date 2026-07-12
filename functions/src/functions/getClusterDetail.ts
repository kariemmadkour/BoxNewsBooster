import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getCluster, getClusterMembers } from "../lib/articleStore";

interface GetClusterDetailInput {
  clusterId: string;
}

export const getClusterDetail = onCall(
  // TEMP: enforceAppCheck disabled -- see fetchNews.ts for why.
  { region: "us-central1", maxInstances: 10 },
  async (request) => {
    const { clusterId } = (request.data ?? {}) as GetClusterDetailInput;
    if (!clusterId || typeof clusterId !== "string") {
      throw new HttpsError("invalid-argument", "clusterId is required");
    }

    const [cluster, articles] = await Promise.all([getCluster(clusterId), getClusterMembers(clusterId)]);

    if (!cluster) {
      throw new HttpsError("not-found", `No cluster found for id ${clusterId}`);
    }

    return { cluster, articles };
  }
);
