import { onRequest } from "firebase-functions/v2/https";
import { requireAuthenticated, requireRole } from "../lib/authz";
import { createKeyword, deleteKeyword, listKeywords, updateKeyword } from "../lib/keywordRegistry";

const WRITE_ROLES = ["editor", "admin"];

// One onRequest handling all 4 routes by inspecting req.method/req.path --
// 4 routes don't justify adding Express as a dependency (nothing else in
// this codebase uses it). Deployed as https://REGION-PROJECT.cloudfunctions.net/keywordsApi[/:id]
//   GET    /            list all keywords (any authenticated user)
//   POST   /             create a keyword (editor/admin)
//   PATCH  /:id          update a keyword (editor/admin)
//   DELETE /:id          delete a keyword (editor/admin)
export const keywordsApi = onRequest({ region: "us-central1" }, async (req, res) => {
  const segments = req.path.split("/").filter(Boolean);
  const id = segments[0];

  try {
    if (req.method === "GET" && !id) {
      const authz = await requireAuthenticated(req, res);
      if (!authz) return;
      const keywords = await listKeywords();
      res.status(200).json({ keywords });
      return;
    }

    if (req.method === "POST" && !id) {
      const authz = await requireRole(req, res, WRITE_ROLES);
      if (!authz) return;
      const { term, editions, active } = req.body ?? {};
      const keyword = await createKeyword({ term, editions, active, createdBy: authz.uid });
      res.status(201).json({ keyword });
      return;
    }

    if (req.method === "PATCH" && id) {
      const authz = await requireRole(req, res, WRITE_ROLES);
      if (!authz) return;
      await updateKeyword(id, req.body ?? {});
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE" && id) {
      const authz = await requireRole(req, res, WRITE_ROLES);
      if (!authz) return;
      await deleteKeyword(id);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(404).json({ error: "Not found" });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});
