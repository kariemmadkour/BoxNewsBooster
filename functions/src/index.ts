import { initializeApp } from "firebase-admin/app";

initializeApp();

export { fetchNews } from "./functions/fetchNews";
export { fetchAllNews } from "./functions/fetchAllNews";
export { classifyArticle } from "./functions/classifyArticle";
export { getSearchTrends } from "./functions/getSearchTrends";

// Phase 2: connector platform
export {
  triggerRssFetch,
  triggerNewsFetch,
  triggerVideoFetch,
  triggerSocialFetch,
} from "./functions/ingestSchedulers";
export {
  onRssIngestTrigger,
  onNewsIngestTrigger,
  onVideoIngestTrigger,
  onSocialIngestTrigger,
} from "./functions/ingestTriggers";
export {
  fetchNewsapiTask,
  fetchGnewsTask,
  fetchGoogleNewsRssTask,
  fetchYoutubeTask,
  fetchTwitterXTask,
} from "./functions/fetchTasks";
export { healthMonitorSweep } from "./functions/healthMonitor";
export { healthCheckHttp } from "./functions/healthCheckHttp";
export { keywordsApi } from "./functions/keywordsApi";

// Phase 3: AI intelligence engine
export { testGenaiHttp } from "./functions/testGenaiHttp";
export { onRawArticlePublished } from "./functions/processArticle";
export { getTrending } from "./functions/getTrending";
export { getClusterDetail } from "./functions/getClusterDetail";
