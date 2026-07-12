// Vertex AI mode (project + location + ADC via the function's own service
// account) -- no API key/Secret Manager entry needed, unlike our other 5
// providers. See docs/tech-stack.md and the Phase 3 plan for why.
export const VERTEX_AI_PROJECT = "boxnewsbooster";
export const VERTEX_AI_LOCATION = "us-central1";

// gemini-3.5-flash does not exist for this project/region (empirically
// verified 2026-07-12 via direct Vertex AI API probing -- 404). gemini-2.5-flash
// is confirmed available and working; re-verify before relying on this
// long-term given Google's rapid Gemini model lifecycle churn.
export const GEMINI_EXTRACTION_MODEL = "gemini-2.5-flash";
export const GEMINI_SUMMARIZATION_MODEL = "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;
