import { TwitterApi, TweetV2 } from "twitter-api-v2";
import { logger } from "firebase-functions/v2";
import { TWITTER_BEARER_TOKEN } from "../config/secrets";
import { getEnabledSourcesByConnector } from "../lib/sourceRegistry";
import { ConnectorHealth, IConnector, NormalizedItem } from "../shared/connector";
import { isMinimallyValid } from "../shared/normalize";
import { hashUrl } from "../utils/hash";
import { mapWithConcurrency } from "../utils/concurrency";

// X API v2 moved to pay-per-use pricing (per-post-read billing, no free
// tier) -- see docs/connector-interface.md. This connector's underlying
// `sources` doc ships with enabled:false until the token's billing mode is
// confirmed; getEnabledSourcesByConnector() will simply return an empty
// list until then, so fetch() is safe to call even while disabled.
const FETCH_CONCURRENCY = 2;
const MAX_RESULTS = 10;

interface RawTweetItem {
  tweet: TweetV2;
  authorUsername: string | undefined;
  country: string | null;
}

function client(): TwitterApi {
  return new TwitterApi(TWITTER_BEARER_TOKEN.value());
}

export const twitterXConnector: IConnector = {
  id: "twitterx",

  async fetch(): Promise<unknown[]> {
    const sources = await getEnabledSourcesByConnector("twitterx");
    if (sources.length === 0) return [];

    const twitter = client();

    const perSourceResults = await mapWithConcurrency(sources, FETCH_CONCURRENCY, async (source) => {
      const query = `${source.query ?? "news"} -is:retweet`;
      try {
        // One page per run, deliberately -- every additional post read is
        // billed under pay-per-use. See docs/connector-interface.md.
        const result = await twitter.v2.search(query, {
          max_results: MAX_RESULTS,
          "tweet.fields": ["created_at", "author_id", "lang", "public_metrics"],
          expansions: ["author_id"],
          "user.fields": ["username", "name"],
        });

        return result.tweets.map((tweet): RawTweetItem => ({
          tweet,
          authorUsername: result.includes.author(tweet)?.username,
          country: source.country,
        }));
      } catch (error) {
        logger.warn("twitterXConnector fetch failed", {
          sourceId: source.id,
          query,
          errorDetail: error instanceof Error ? error.message : String(error),
        });
        return [];
      }
    });

    return perSourceResults.flat();
  },

  normalize(raw: unknown[]): NormalizedItem[] {
    return (raw as RawTweetItem[]).map(({ tweet, authorUsername, country }) => {
      const url = `https://x.com/i/web/status/${tweet.id}`;
      return {
        id: hashUrl(url),
        title: tweet.text.length > 100 ? `${tweet.text.slice(0, 99)}…` : tweet.text,
        summary: tweet.text,
        url,
        publishedAt: tweet.created_at ?? new Date().toISOString(),
        author: authorUsername ? `@${authorUsername}` : undefined,
        publisher: "X",
        country: country ?? "us",
        language: tweet.lang ?? "en",
        sourceType: "social",
      };
    });
  },

  validate(item: NormalizedItem): boolean {
    return isMinimallyValid(item);
  },

  async healthCheck(): Promise<ConnectorHealth> {
    // Real cost implication: even this minimal call is billed post-reads
    // under pay-per-use. Only invoke from the hourly health-monitor sweep
    // (functions/healthMonitor.ts), not on a tight cadence -- see
    // docs/connector-interface.md.
    try {
      const result = await client().v2.search("news -is:retweet", { max_results: MAX_RESULTS });
      if (result.tweets.length === 0) {
        return { healthy: false, message: "Search returned zero results" };
      }
      return { healthy: true };
    } catch (error) {
      return { healthy: false, message: error instanceof Error ? error.message : String(error) };
    }
  },
};
