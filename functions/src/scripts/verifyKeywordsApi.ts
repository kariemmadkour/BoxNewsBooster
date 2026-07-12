// End-to-end verification of the keyword-management API against the
// emulator suite (Auth + Functions + Firestore): grants the "editor" role,
// mints a real ID token via the Auth emulator's REST API, then exercises
// create -> list -> update -> delete through the deployed (emulated)
// keywordsApi function. Run via firebase emulators:exec.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const FUNCTIONS_BASE = "http://127.0.0.1:5001/boxnewsbooster/us-central1/keywordsApi";
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!AUTH_EMULATOR_HOST) {
  console.error("FIREBASE_AUTH_EMULATOR_HOST is not set -- run via firebase emulators:exec --only functions,firestore,auth");
  process.exit(1);
}

initializeApp({ projectId: "boxnewsbooster" });

async function mintIdToken(email: string, role: string): Promise<string> {
  const auth = getAuth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email });
  }
  await auth.setCustomUserClaims(user.uid, { role });
  const customToken = await auth.createCustomToken(user.uid, { role });

  const response = await fetch(`http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const data = (await response.json()) as { idToken?: string; error?: unknown };
  if (!data.idToken) {
    throw new Error(`Failed to mint ID token: ${JSON.stringify(data.error)}`);
  }
  return data.idToken;
}

async function main() {
  console.log("Minting an editor-role ID token via the Auth emulator...");
  const idToken = await mintIdToken("test-editor@boxnewsbooster.test", "editor");
  const headers = { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" };

  console.log("\n1. POST (create)...");
  const createRes = await fetch(FUNCTIONS_BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ term: "الجهاز المركزي للتعبئة العامة", editions: [{ country: "EG", lang: "ar" }] }),
  });
  const created = (await createRes.json()) as { keyword: { id: string } };
  console.log(`  status=${createRes.status}`, created);
  if (createRes.status !== 201) throw new Error("create failed");
  const id = created.keyword.id;

  console.log("\n2. GET (list)...");
  const listRes = await fetch(FUNCTIONS_BASE, { headers });
  const listed = (await listRes.json()) as { keywords: { id: string }[] };
  console.log(`  status=${listRes.status}, count=${listed.keywords?.length}`);
  if (listRes.status !== 200 || !listed.keywords?.some((k: { id: string }) => k.id === id)) {
    throw new Error("list did not include created keyword");
  }

  console.log("\n3. PATCH (deactivate)...");
  const patchRes = await fetch(`${FUNCTIONS_BASE}/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ active: false }),
  });
  console.log(`  status=${patchRes.status}`, await patchRes.json());
  if (patchRes.status !== 200) throw new Error("update failed");

  console.log("\n4. DELETE...");
  const deleteRes = await fetch(`${FUNCTIONS_BASE}/${id}`, { method: "DELETE", headers });
  console.log(`  status=${deleteRes.status}`, await deleteRes.json());
  if (deleteRes.status !== 200) throw new Error("delete failed");

  console.log("\nAll keyword API checks passed.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});
