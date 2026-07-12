import { NewsProviderName } from "../types/article";
import { gnewsProvider } from "./gnewsProvider";
import { googleNewsRssProvider } from "./googleNewsRssProvider";
import { newsApiOrgProvider } from "./newsApiOrgProvider";
import { NewsProvider } from "./newsProvider";

const PROVIDERS: Record<NewsProviderName, NewsProvider> = {
  newsapi: newsApiOrgProvider,
  gnews: gnewsProvider,
  googlenewsrss: googleNewsRssProvider,
};

export function getProvider(name: NewsProviderName): NewsProvider {
  return PROVIDERS[name];
}
