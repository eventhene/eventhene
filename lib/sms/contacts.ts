import { db } from "@/lib/db";
import { normalizeGhPhone } from "./phone";

export interface RawContact {
  name?: string | null;
  phone: string;
}

export interface ImportStats {
  added: number;
  duplicates: number;
  invalid: number;
  total: number;
}

export const MAX_CONTACTS_PER_REQUEST = 5000;
export const MAX_CONTACTS_PER_LIST = 20000;

/** Normalizes, de-duplicates and inserts contacts into a list the caller already owns. */
export async function importContacts(listId: string, raw: RawContact[]): Promise<ImportStats> {
  const seen = new Set<string>();
  const rows: { listId: string; phone: string; name: string | null }[] = [];
  let invalid = 0;
  let duplicates = 0;

  for (const c of raw.slice(0, MAX_CONTACTS_PER_REQUEST)) {
    const phone = normalizeGhPhone(c.phone ?? "");
    if (!phone) {
      invalid++;
      continue;
    }
    if (seen.has(phone)) {
      duplicates++;
      continue;
    }
    seen.add(phone);
    const name = c.name?.toString().trim().slice(0, 80) || null;
    rows.push({ listId, phone, name });
  }

  const existing = await db.contact.count({ where: { listId } });
  const room = Math.max(0, MAX_CONTACTS_PER_LIST - existing);
  const toInsert = rows.slice(0, room);

  const res = toInsert.length
    ? await db.contact.createMany({ data: toInsert, skipDuplicates: true })
    : { count: 0 };

  const alreadyInList = toInsert.length - res.count;
  const total = await db.contact.count({ where: { listId } });
  return {
    added: res.count,
    duplicates: duplicates + alreadyInList,
    invalid,
    total,
  };
}
