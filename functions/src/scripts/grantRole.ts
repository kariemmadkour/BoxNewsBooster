// One-off admin script -- run locally (not deployed) to grant a custom
// `role` claim to your own account for testing the keyword-management API.
// Reuses your already-authenticated `firebase login` / gcloud ADC session
// -- no new credentials needed.
//
// Usage: npm run grant:role -- you@example.com editor
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
const role = process.argv[3] ?? "editor";

if (!email) {
  console.error("Usage: npm run grant:role -- <email> [role]");
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId: "boxnewsbooster" });

async function main() {
  const auth = getAuth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email });
    console.log(`Created new user: ${email} (${user.uid})`);
  }

  await auth.setCustomUserClaims(user.uid, { role });
  console.log(`Granted role "${role}" to ${email} (${user.uid}).`);
  console.log("Note: existing ID tokens won't reflect this until refreshed/reissued.");
  process.exit(0);
}

main().catch((error) => {
  console.error("grantRole failed:", error);
  process.exit(1);
});
