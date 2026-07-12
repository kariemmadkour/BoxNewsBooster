import { NativeCategory } from "../config/categories";
import { NewsProviderName, RawProviderArticle } from "../types/article";

export interface FetchParams {
  country: string;
  category: NativeCategory;
  keyword: string | null;
  page: number;
  pageSize: number;
  apiKey: string;
}

// Extension point: add a new provider (e.g. Mediastack, Currents API) by
// implementing this interface and registering it in providers/index.ts --
// no other code needs to change.
export interface NewsProvider {
  name: NewsProviderName;
  fetch(params: FetchParams): Promise<RawProviderArticle[]>;
}
