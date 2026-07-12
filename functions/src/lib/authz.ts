import { getAuth } from "firebase-admin/auth";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";

export interface AuthzResult {
  uid: string;
  role: string | undefined;
}

// Verifies `Authorization: Bearer <idToken>` and checks the decoded token's
// `role` custom claim against `allowedRoles`. Returns null (after writing
// the 401/403 response itself) on failure so callers can `if (!authz) return;`.
export async function requireRole(req: Request, res: Response, allowedRoles: string[]): Promise<AuthzResult | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization: Bearer <idToken> header" });
    return null;
  }

  const idToken = header.slice("Bearer ".length);
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    const role = decoded.role as string | undefined;
    if (!allowedRoles.includes(role ?? "")) {
      res.status(403).json({ error: `Requires one of roles: ${allowedRoles.join(", ")}` });
      return null;
    }
    return { uid: decoded.uid, role };
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired ID token", detail: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

// Weaker check for read endpoints -- any authenticated user, any role.
export async function requireAuthenticated(req: Request, res: Response): Promise<AuthzResult | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization: Bearer <idToken> header" });
    return null;
  }
  const idToken = header.slice("Bearer ".length);
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, role: decoded.role as string | undefined };
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired ID token", detail: error instanceof Error ? error.message : String(error) });
    return null;
  }
}
