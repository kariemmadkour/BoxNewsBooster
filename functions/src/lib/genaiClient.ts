import { GoogleGenAI } from "@google/genai";
import { VERTEX_AI_LOCATION, VERTEX_AI_PROJECT } from "../config/genai";

let client: GoogleGenAI | undefined;

// Vertex AI mode -- Application Default Credentials via the function's own
// service account (roles/aiplatform.user granted in Tier 0), no API key.
export function genai(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project: VERTEX_AI_PROJECT,
      location: VERTEX_AI_LOCATION,
    });
  }
  return client;
}
