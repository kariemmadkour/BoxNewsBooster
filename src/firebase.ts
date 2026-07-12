import { initializeApp } from "firebase/app";
import { getFunctions } from "firebase/functions";

// Public client config -- safe to ship in the built bundle. All actual
// data access is server-mediated through Cloud Functions.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || "us-central1");

// Hook point for Firebase App Check (reCAPTCHA v3), recommended as the
// primary anti-abuse/cost-control lever since there's no user auth to gate
// callable functions on. Left disabled until VITE_RECAPTCHA_SITE_KEY is set.
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
//   initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
//     isTokenAutoRefreshEnabled: true,
//   });
// }
