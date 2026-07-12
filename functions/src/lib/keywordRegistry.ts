import { getFirestore, Timestamp } from "firebase-admin/firestore";

export interface Edition {
  country: string;
  lang: string;
}

export interface KeywordDoc {
  id: string;
  term: string;
  active: boolean;
  editions: Edition[];
  createdBy: string;
}

function db() {
  return getFirestore();
}

export async function getActiveKeywordsWithEditions(): Promise<KeywordDoc[]> {
  const snap = await db().collection("keywords").where("active", "==", true).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as KeywordDoc);
}

export async function listKeywords(): Promise<KeywordDoc[]> {
  const snap = await db().collection("keywords").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as KeywordDoc);
}

export interface CreateKeywordInput {
  term: string;
  editions: Edition[];
  active?: boolean;
  createdBy: string;
}

const MAX_TERM_LENGTH = 100;
const MAX_EDITIONS = 20;

function validateKeywordInput(term: string, editions: Edition[]): void {
  if (!term || term.trim().length === 0) {
    throw new Error("term is required");
  }
  if (term.length > MAX_TERM_LENGTH) {
    throw new Error(`term must be <= ${MAX_TERM_LENGTH} chars`);
  }
  if (!Array.isArray(editions) || editions.length === 0) {
    throw new Error("at least one edition is required");
  }
  if (editions.length > MAX_EDITIONS) {
    throw new Error(`editions must be <= ${MAX_EDITIONS}`);
  }
  for (const e of editions) {
    if (!e.country || !e.lang) {
      throw new Error("each edition requires country and lang");
    }
  }
}

export async function createKeyword(input: CreateKeywordInput): Promise<KeywordDoc> {
  validateKeywordInput(input.term, input.editions);
  const now = Timestamp.now();
  const ref = await db()
    .collection("keywords")
    .add({
      term: input.term.trim(),
      active: input.active ?? true,
      editions: input.editions,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  const snap = await ref.get();
  return { id: ref.id, ...snap.data() } as KeywordDoc;
}

export interface UpdateKeywordInput {
  term?: string;
  editions?: Edition[];
  active?: boolean;
}

export async function updateKeyword(id: string, input: UpdateKeywordInput): Promise<void> {
  if (input.term !== undefined || input.editions !== undefined) {
    validateKeywordInput(input.term ?? "placeholder", input.editions ?? [{ country: "us", lang: "en" }]);
  }
  await db()
    .collection("keywords")
    .doc(id)
    .set({ ...input, updatedAt: Timestamp.now() }, { merge: true });
}

export async function deleteKeyword(id: string): Promise<void> {
  await db().collection("keywords").doc(id).delete();
}
