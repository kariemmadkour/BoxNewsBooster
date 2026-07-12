import { NewsProviderName } from "../types/article";
import { gnewsProvider } from "./gnewsProvider";
import { newsApiOrgProvider } from "./newsApiOrgProvider";
import { NewsProvider } from "./newsProvider";

const PROVIDERS: Record<NewsProviderName, NewsProvider> = {
  newsapi: newsApiOrgProvider,
  gnews: gnewsProvider,
};

export function getProvider(name: NewsProviderName): NewsProvider {
  return PROVIDERS[name];
}
