import { getFirestore } from "firebase-admin/firestore";

const DEFAULT_MODEL_ID = "claude-sonnet-5";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

let cachedModelId: string | null = null;
let cachedAt = 0;

// Reads config/anthropic.modelId so the classification model can be bumped
// (e.g. to a newer Sonnet) without a function redeploy. Falls back to a
// hardcoded default if the doc is missing or Firestore is unreachable.
export async function getAnthropicModelId(): Promise<string> {
  const isFresh = cachedModelId !== null && Date.now() - cachedAt < REFRESH_INTERVAL_MS;
  if (isFresh) return cachedModelId as string;

  try {
    const snap = await getFirestore().collection("config").doc("anthropic").get();
    const modelId = snap.exists ? (snap.data()?.modelId as string | undefined) : undefined;
    cachedModelId = modelId && modelId.length > 0 ? modelId : DEFAULT_MODEL_ID;
  } catch {
    cachedModelId = cachedModelId ?? DEFAULT_MODEL_ID;
  }
  cachedAt = Date.now();
  return cachedModelId;
}
