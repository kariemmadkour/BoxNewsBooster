import { initializeApp } from "firebase-admin/app";

initializeApp();

export { fetchNews } from "./functions/fetchNews";
export { classifyArticle } from "./functions/classifyArticle";
export { getSearchTrends } from "./functions/getSearchTrends";
