import Parser from "rss-parser";
import { logger } from "firebase-functions/v2";
import { getActiveKeywordsWithEditions } from "../lib/keywordRegistry";
import { ConnectorHealth, IConnector, NormalizedItem } from "../shared/connector";
import { isMinimallyValid } from "../shared/normalize";
import { hashUrl } from "../utils/hash";
import { mapWithConcurrency } from "../utils/concurrency";

// Public, unauthenticated endpoint -- no API key, no Secret Manager entry.
// See docs/connector-interface.md for the "unofficial but stable in
// practice" caveat and docs/scheduling-strategy.md for the rate-limit
// reasoning (concurrency capped at 5, polled every 10 min at the scheduler
// level, which naturally satisfies the "no tighter than 10-15 min per
// keyword x edition" guidance without extra bookkeeping here).
const CONCURRENCY = 5;
const HEALTH_CHECK_URL = "https://news.google.com/rss/search?q=news&hl=ar&gl=EG&ceid=EG:ar";

type RssItem = Parser.Item & { source?: string };

const parser = new Parser<unknown, { source?: string }>({
  customFields: { item: ["source"] },
});

interface FeedTarget {
  url: string;
  term: string;
  country: string;
  lang: string;
}

interface RawGoogleNewsItem {
  item: RssItem;
  term: string;
  country: string;
  lang: string;
}

function buildFeedUrl(term: string, country: string, lang: string): string {
  const q = encodeURIComponent(term);
  return `https://news.google.com/rss/search?q=${q}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
}

// Google News formats titles as "Headline - Publisher Name". Used only as a
// fallback when the non-standard <source> tag isn't present on an item.
function guessPublisherFromTitle(title: string): string | undefined {
  const idx = title.lastIndexOf(" - ");
  return idx === -1 ? undefined : title.slice(idx + 3).trim();
}

async function fetchOneFeed(target: FeedTarget): Promise<RawGoogleNewsItem[]> {
  try {
    const feed = await parser.parseURL(target.url);
    return (feed.items as RssItem[]).map((item) => ({
      item,
      term: target.term,
      country: target.country,
      lang: target.lang,
    }));
  } catch (error) {
    logger.warn("googleNewsRss feed fetch failed", {
      term: target.term,
      country: target.country,
      lang: target.lang,
      errorDetail: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export const googleNewsRssConnector: IConnector = {
  id: "googlenewsrss",

  async fetch(): Promise<unknown[]> {
    const keywords = await getActiveKeywordsWithEditions();
    const targets: FeedTarget[] = [];
    for (const keyword of keywords) {
      for (const edition of keyword.editions) {
        targets.push({
          url: buildFeedUrl(keyword.term, edition.country, edition.lang),
          term: keyword.term,
          country: edition.country,
          lang: edition.lang,
        });
      }
    }

    const results = await mapWithConcurrency(targets, CONCURRENCY, fetchOneFeed);
    return results.flat();
  },

  normalize(raw: unknown[]): NormalizedItem[] {
    return (raw as RawGoogleNewsItem[])
      .filter(({ item }) => item.link && item.title)
      .map(({ item, term, country, lang }) => ({
        id: hashUrl(item.link as string),
        title: item.title as string,
        summary: item.contentSnippet ?? undefined,
        url: item.link as string,
        publishedAt: item.isoDate ?? new Date(item.pubDate ?? Date.now()).toISOString(),
        publisher: item.source ?? guessPublisherFromTitle(item.title as string) ?? "Unknown",
        country,
        language: lang,
        tags: [term],
        sourceType: "rss",
      }));
  },

  validate(item: NormalizedItem): boolean {
    return isMinimallyValid(item);
  },

  async healthCheck(): Promise<ConnectorHealth> {
    try {
      const response = await fetch(HEALTH_CHECK_URL);
      const body = await response.text();
      if (!response.ok || !body.includes("<rss")) {
        return { healthy: false, message: `HTTP ${response.status}, valid RSS root: ${body.includes("<rss")}` };
      }
      return { healthy: true };
    } catch (error) {
      return { healthy: false, message: error instanceof Error ? error.message : String(error) };
    }
  },
};
