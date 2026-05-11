import slugify from "slugify";
import { db } from "./db";

export async function generateUniqueEventSlug(title: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true, trim: true }) || "event";
  let candidate = base;
  let i = 1;
  while (await db.event.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${i++}`;
    if (i > 100) {
      candidate = `${base}-${Date.now()}`;
      break;
    }
  }
  return candidate;
}

export async function generateUniqueOrganizerSlug(displayName: string): Promise<string> {
  const base = slugify(displayName, { lower: true, strict: true, trim: true }) || "organizer";
  let candidate = base;
  let i = 1;
  while (await db.organizer.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${i++}`;
    if (i > 100) {
      candidate = `${base}-${Date.now()}`;
      break;
    }
  }
  return candidate;
}
