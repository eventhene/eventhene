import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = (() => {
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
})();

export const FLYERS_BUCKET = process.env.SUPABASE_BUCKET_FLYERS || "flyers";
export const TICKETS_BUCKET = process.env.SUPABASE_BUCKET_TICKETS || "tickets";

export async function uploadFlyer(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (!supabaseAdmin) throw new Error("Supabase not configured");
  const path = `${Date.now()}-${fileName}`;
  const { error } = await supabaseAdmin.storage
    .from(FLYERS_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) throw error;
  const { data } = supabaseAdmin.storage.from(FLYERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadTicketPdf(ticketId: string, pdf: Buffer): Promise<string> {
  if (!supabaseAdmin) throw new Error("Supabase not configured");
  const path = `${ticketId}.pdf`;
  const { error } = await supabaseAdmin.storage
    .from(TICKETS_BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  // signed URL valid for 7 days
  const { data, error: sErr } = await supabaseAdmin.storage
    .from(TICKETS_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (sErr || !data) throw sErr ?? new Error("Could not sign URL");
  return data.signedUrl;
}

export async function refreshTicketPdfUrl(ticketId: string): Promise<string> {
  if (!supabaseAdmin) throw new Error("Supabase not configured");
  const path = `${ticketId}.pdf`;
  const { data, error } = await supabaseAdmin.storage
    .from(TICKETS_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error || !data) throw error ?? new Error("Could not sign URL");
  return data.signedUrl;
}
