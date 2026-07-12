import { logger } from "firebase-functions/v2";
import { YOUTUBE_API_KEY } from "../config/secrets";
import { getEnabledSourcesByConnector } from "../lib/sourceRegistry";
import { ConnectorHealth, IConnector, NormalizedItem } from "../shared/connector";
import { isMinimallyValid, truncate } from "../shared/normalize";
import { hashUrl } from "../utils/hash";
import { mapWithConcurrency } from "../utils/concurrency";

// Native fetch(), deliberately not the `googleapis` package -- the two
// calls needed here (search.list, videos.list) are plain API-key GETs, and
// `googleapis` is a large dependency for that. See docs/tech-stack.md.
const BASE_URL = "https://www.googleapis.com/youtube/v3";
const FETCH_CONCURRENCY = 3;
const MAX_RESULTS = 10;

interface YouTubeSearchItem {
  id: { videoId?: string };
}
interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  error?: { message: string };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails?: { high?: { url: string }; medium?: { url: string } };
    tags?: string[];
    defaultAudioLanguage?: string;
  };
}
interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[];
  error?: { message: string };
}

interface RawYouTubeItem {
  video: YouTubeVideoItem;
  country: string | null;
}

async function searchVideoIds(query: string, apiKey: string): Promise<string[]> {
  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", String(MAX_RESULTS));
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = (await response.json()) as YouTubeSearchResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `YouTube search.list failed: HTTP ${response.status}`);
  }
  return (data.items ?? []).map((item) => item.id.videoId).filter((id): id is string => Boolean(id));
}

async function fetchVideoDetails(videoIds: string[], apiKey: string): Promise<YouTubeVideoItem[]> {
  if (videoIds.length === 0) return [];
  const url = new URL(`${BASE_URL}/videos`);
  url.searchParams.set("part", "snippet,statistics,contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = (await response.json()) as YouTubeVideosResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `YouTube videos.list failed: HTTP ${response.status}`);
  }
  return data.items ?? [];
}

export const youtubeConnector: IConnector = {
  id: "youtube",

  async fetch(): Promise<unknown[]> {
    const sources = await getEnabledSourcesByConnector("youtube");
    const apiKey = YOUTUBE_API_KEY.value();

    const perSourceResults = await mapWithConcurrency(sources, FETCH_CONCURRENCY, async (source) => {
      const query = source.query ?? "news";
      try {
        const videoIds = await searchVideoIds(query, apiKey);
        const videos = await fetchVideoDetails(videoIds, apiKey);
        return videos.map((video): RawYouTubeItem => ({ video, country: source.country }));
      } catch (error) {
        // Field named errorDetail, not "message" -- Firebase's structured
        // logger has its own top-level "message" field (the first arg
        // here), and a same-named field on the metadata object gets
        // silently shadowed in the printed JSON instead of showing the
        // real error. Same bug class as the earlier trends.ts fix.
        logger.warn("youtubeConnector fetch failed", {
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
    return (raw as RawYouTubeItem[]).map(({ video, country }) => ({
      id: hashUrl(`https://www.youtube.com/watch?v=${video.id}`),
      title: video.snippet.title,
      summary: truncate(video.snippet.description, 500),
      url: `https://www.youtube.com/watch?v=${video.id}`,
      publishedAt: video.snippet.publishedAt,
      author: video.snippet.channelTitle,
      publisher: video.snippet.channelTitle,
      country: country ?? "us",
      language: video.snippet.defaultAudioLanguage ?? "en",
      image: video.snippet.thumbnails?.high?.url ?? video.snippet.thumbnails?.medium?.url,
      tags: video.snippet.tags,
      sourceType: "video",
    }));
  },

  validate(item: NormalizedItem): boolean {
    return isMinimallyValid(item);
  },

  async healthCheck(): Promise<ConnectorHealth> {
    try {
      const url = new URL(`${BASE_URL}/videos`);
      url.searchParams.set("part", "snippet");
      url.searchParams.set("chart", "mostPopular");
      url.searchParams.set("maxResults", "1");
      url.searchParams.set("regionCode", "US");
      url.searchParams.set("key", YOUTUBE_API_KEY.value());
      const response = await fetch(url.toString());
      const data = (await response.json()) as YouTubeVideosResponse;
      if (!response.ok) {
        return { healthy: false, message: data.error?.message ?? `HTTP ${response.status}` };
      }
      return { healthy: true };
    } catch (error) {
      return { healthy: false, message: error instanceof Error ? error.message : String(error) };
    }
  },
};
