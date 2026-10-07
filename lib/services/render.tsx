import React from "react";
import fs from "fs";
import path from "path";
import {
  renderToBuffer,
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  StyleSheet,
} from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { buildQrPayload, qrToDataUrl } from "@/lib/qr";
import { uploadTicketPdf } from "@/lib/storage";

const PAGE_W = 612;
const PAGE_H = 244;
const STUB_W = 150;
const BODY_W = PAGE_W - STUB_W;
const GOLD = "#D4A853";

interface Tier {
  accent: string;
  stubBg: string;
  badgeBg: string;
  badgeText: string;
  label: string;
}

/** Same colour coding as the home page ticket: Regular grey, VIP gold, VVIP red. */
function tierFor(name: string): Tier {
  const n = name.toLowerCase();
  if (n.includes("vvip")) {
    return { accent: "#e74c3c", stubBg: "#2a1212", badgeBg: "#e74c3c", badgeText: "#ffffff", label: name };
  }
  if (n.includes("vip")) {
    return { accent: GOLD, stubBg: "#241c09", badgeBg: GOLD, badgeText: "#111111", label: name };
  }
  return { accent: "#9a9a9a", stubBg: "#1c1c1f", badgeBg: "#3a3a3f", badgeText: "#e5e5e5", label: name };
}

const s = StyleSheet.create({
  page: { backgroundColor: "#0a0a0c", padding: 0 },
  card: { width: PAGE_W, height: PAGE_H, flexDirection: "row" },
  body: { width: BODY_W, height: PAGE_H, position: "relative", backgroundColor: "#111114" },
  bodyContent: { position: "absolute", top: 0, left: 0, width: BODY_W, height: PAGE_H, padding: 22, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandWrap: { flexDirection: "row", alignItems: "center" },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 3, color: GOLD },
  badge: { fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 1, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 24, color: "#ffffff", lineHeight: 1.1, maxWidth: BODY_W - 60 },
  detailRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD, marginRight: 7 },
  detail: { fontFamily: "Helvetica", fontSize: 10, color: "#d4d4d8" },
  detailStrong: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#ffffff" },
  stub: { width: STUB_W, height: PAGE_H, alignItems: "center", justifyContent: "center", position: "relative" },
  stubStrip: { position: "absolute", top: 0, left: 0, width: STUB_W, height: 5 },
  scanLabel: { fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 2, marginBottom: 8 },
  qrBox: { backgroundColor: "#ffffff", padding: 6, borderRadius: 8 },
  idLabel: { fontFamily: "Helvetica-Bold", fontSize: 6, letterSpacing: 2, color: "#8b8b95", marginTop: 10 },
  idValue: { fontFamily: "Courier-Bold", fontSize: 9.5, marginTop: 2 },
  tierName: { fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 6 },
});

interface TicketPdfProps {
  event: { title: string; venue: string; timezone: string; startsAt: Date };
  attendee: { fullName: string };
  ticket: { visibleRef: string; ticketTypeName: string };
  qrDataUrl: string;
  flyerDataUrl?: string | null;
  logoDataUrl?: string | null;
}

const TicketPdf: React.FC<TicketPdfProps> = ({ event, attendee, ticket, qrDataUrl, flyerDataUrl, logoDataUrl }) => {
  const tier = tierFor(ticket.ticketTypeName);
  const when = new Date(event.startsAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: event.timezone,
  });
  const title = event.title.length > 60 ? event.title.slice(0, 57) + "..." : event.title;

  return (
    <Document title={`${event.title} - ${ticket.visibleRef}`}>
      <Page size={[PAGE_W, PAGE_H]} style={s.page}>
        <View style={s.card}>
          {/* ---------- main body ---------- */}
          <View style={s.body}>
            {flyerDataUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={flyerDataUrl} style={{ position: "absolute", top: 0, left: 0, width: BODY_W, height: PAGE_H, objectFit: "cover" }} />
            )}
            <Svg width={BODY_W} height={PAGE_H} style={{ position: "absolute", top: 0, left: 0 }}>
              <Defs>
                <LinearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#000000" stopOpacity={flyerDataUrl ? 0.96 : 0} />
                  <Stop offset="0.55" stopColor="#000000" stopOpacity={flyerDataUrl ? 0.78 : 0} />
                  <Stop offset="1" stopColor="#000000" stopOpacity={flyerDataUrl ? 0.3 : 0} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={BODY_W} height={PAGE_H} fill="url(#fade)" />
            </Svg>

            <View style={s.bodyContent}>
              <View>
                <View style={s.topRow}>
                  <View style={s.brandWrap}>
                    {logoDataUrl ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image src={logoDataUrl} style={{ width: 17, height: 22, marginRight: 7 }} />
                    ) : null}
                    <Text style={s.brand}>EVENTHENE</Text>
                  </View>
                  <Text style={[s.badge, { backgroundColor: tier.badgeBg, color: tier.badgeText }]}>
                    {tier.label.toUpperCase()}
                  </Text>
                </View>
                <Text style={[s.title, { marginTop: 16 }]}>{title}</Text>
              </View>

              <View>
                <View style={s.detailRow}>
                  <View style={s.dot} />
                  <Text style={s.detail}>{when}</Text>
                </View>
                <View style={s.detailRow}>
                  <View style={s.dot} />
                  <Text style={s.detail}>{event.venue}</Text>
                </View>
                <View style={[s.detailRow, { marginTop: 9 }]}>
                  <Text style={s.detailStrong}>{attendee.fullName}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ---------- perforation ---------- */}
          <Svg width={14} height={PAGE_H} style={{ position: "absolute", top: 0, left: BODY_W - 7 }}>
            <Circle cx="7" cy="0" r="8" fill="#0a0a0c" />
            <Circle cx="7" cy={PAGE_H} r="8" fill="#0a0a0c" />
            <Rect x="6.5" y="14" width="1" height={PAGE_H - 28} fill={tier.accent} fillOpacity={0.45} />
          </Svg>

          {/* ---------- stub ---------- */}
          <View style={[s.stub, { backgroundColor: tier.stubBg }]}>
            <View style={[s.stubStrip, { backgroundColor: tier.accent }]} />
            <Text style={[s.scanLabel, { color: tier.accent }]}>SCAN TO ENTER</Text>
            <View style={[s.qrBox, { borderWidth: 2, borderColor: tier.accent }]}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={qrDataUrl} style={{ width: 98, height: 98 }} />
            </View>
            <Text style={s.idLabel}>TICKET ID</Text>
            <Text style={[s.idValue, { color: tier.accent }]}>{ticket.visibleRef}</Text>
            <Text style={[s.tierName, { color: tier.accent }]}>{tier.label.toUpperCase()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

/** react-pdf only supports JPEG and PNG. Anything else (or a slow/failed fetch) falls back to no flyer. */
async function flyerToDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (type !== "image/jpeg" && type !== "image/png") return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 3_000_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

let logoCache: string | null | undefined;

async function logoToDataUrl(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    const file = path.join(process.cwd(), "public", "logo-icon.png");
    logoCache = `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
    return logoCache;
  } catch {
    // fall through to fetching from the site itself
  }
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "https://eventhene.vercel.app";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${base}/logo-icon.png`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      logoCache = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
      return logoCache;
    }
  } catch {
    // no logo is fine, the wordmark text still shows
  }
  logoCache = null;
  return null;
}

export async function renderTicketPdfBuffer(ticketId: string): Promise<Buffer> {
  const ticket = await db.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { attendee: true, ticketType: true, event: true }
  });
  const payload = buildQrPayload(ticket.qrToken, ticket.eventId);
  const [qr, flyerDataUrl, logoDataUrl] = await Promise.all([
    qrToDataUrl(payload),
    flyerToDataUrl(ticket.event.flyerUrl),
    logoToDataUrl(),
  ]);
  const element = React.createElement(TicketPdf, {
    event: ticket.event,
    attendee: ticket.attendee,
    ticket: { visibleRef: ticket.visibleRef, ticketTypeName: ticket.ticketType.name },
    qrDataUrl: qr,
    flyerDataUrl,
    logoDataUrl,
  });
  // @ts-ignore react-pdf typings
  return renderToBuffer(element);
}

/** Renders and stores each ticket PDF. Returns the buffers that rendered so callers can reuse them. */
export async function renderAndStoreTicketPdfs(ticketIds: string[]): Promise<Map<string, Buffer>> {
  const buffers = new Map<string, Buffer>();
  for (const id of ticketIds) {
    try {
      const buf = await renderTicketPdfBuffer(id);
      buffers.set(id, buf);
      const url = await uploadTicketPdf(id, buf);
      await db.ticket.update({ where: { id }, data: { pdfUrl: url } });
    } catch (e) {
      console.error("[render] failed for ticket", id, e);
    }
  }
  return buffers;
}
