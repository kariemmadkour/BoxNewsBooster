import { defineSecret } from "firebase-functions/params";

// Real values are never in any file -- set with:
//   firebase functions:secrets:set NEWS_API_KEY
//   firebase functions:secrets:set GNEWS_API_KEY
//   firebase functions:secrets:set ANTHROPIC_API_KEY
export const NEWS_API_KEY = defineSecret("NEWS_API_KEY");
export const GNEWS_API_KEY = defineSecret("GNEWS_API_KEY");
export const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");
