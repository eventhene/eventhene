import { getAppUrl } from "@/lib/app-url";
import React from "react";
import fs from "fs";
import path from "path";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
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
  Line,
  Font,
  StyleSheet,
} from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { buildQrPayload, qrToDataUrl } from "@/lib/qr";
import { uploadTicketPdf } from "@/lib/storage";

/* ---------- fonts ---------- */
const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const FONT_FILES = ["Inter-400.woff", "Inter-600.woff", "Inter-800.woff", "JetBrainsMono-700.woff"];
const fontsReady = (() => {
  try {
    if (!FONT_FILES.every((f) => fs.existsSync(path.join(FONT_DIR, f)))) return false;
    Font.register({
      family: "Inter",
      fonts: [
        { src: path.join(FONT_DIR, "Inter-400.woff"), fontWeight: 400 },
        { src: path.join(FONT_DIR, "Inter-600.woff"), fontWeight: 600 },
        { src: path.join(FONT_DIR, "Inter-800.woff"), fontWeight: 800 },
      ],
    });
    Font.register({ family: "JetBrainsMono", src: path.join(FONT_DIR, "JetBrainsMono-700.woff"), fontWeight: 700 });
    return true;
  } catch (e) {
    console.error("[render] custom fonts unavailable, using Helvetica", e);
    return false;
  }
})();
Font.registerHyphenationCallback((word) => [word]);
// Falls back to the built-in fonts automatically if the font files cannot be loaded.
const FONT = fontsReady
  ? { body: "Inter", mono: "JetBrainsMono", regular: 400 as const, semi: 600 as const, heavy: 800 as const }
  : { body: "Helvetica", mono: "Courier-Bold", regular: 400 as const, semi: 400 as const, heavy: 400 as const };

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
  logoFullDataUrl?: string | null;
  backdropDataUrl?: string | null;
  accent?: string | null;
}

const TicketPdfLandscape: React.FC<TicketPdfProps> = ({ event, attendee, ticket, qrDataUrl, flyerDataUrl, logoDataUrl, logoFullDataUrl }) => {
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
                    {logoFullDataUrl ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image src={logoFullDataUrl} style={{ width: 82, height: 27 }} />
                    ) : (
                      <Text style={s.brand}>EVENTHENE</Text>
                    )}
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



/* =====================================================================
   Backdrop for the vertical ticket. react-pdf cannot blur or mask, so we composite
   one image ourselves: the sharp flyer on top that dissolves into a blurred, darkened
   copy of itself below. We also pull an accent colour out of the flyer.
   ===================================================================== */
interface Raster {
  w: number;
  h: number;
  data: Uint8ClampedArray; // RGBA
}

function decodeRaster(buf: Buffer, type: string): Raster | null {
  try {
    if (type === "image/jpeg") {
      const img = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 256 });
      return { w: img.width, h: img.height, data: new Uint8ClampedArray(img.data) };
    }
    if (type === "image/png") {
      const img = PNG.sync.read(buf);
      return { w: img.width, h: img.height, data: new Uint8ClampedArray(img.data) };
    }
  } catch {
    return null;
  }
  return null;
}

/** Bilinear "cover" sample of src into an outW x outH raster. anchorY 0 = keep the top of the flyer. */
function coverSample(src: Raster, outW: number, outH: number, anchorY: number): Raster {
  const out = new Uint8ClampedArray(outW * outH * 4);
  const scale = Math.max(outW / src.w, outH / src.h);
  const viewW = outW / scale;
  const viewH = outH / scale;
  const offX = (src.w - viewW) / 2;
  const offY = (src.h - viewH) * anchorY;
  for (let y = 0; y < outH; y++) {
    const sy = Math.min(src.h - 1.001, Math.max(0, offY + (y + 0.5) / scale - 0.5));
    const y0 = Math.floor(sy);
    const fy = sy - y0;
    for (let x = 0; x < outW; x++) {
      const sx = Math.min(src.w - 1.001, Math.max(0, offX + (x + 0.5) / scale - 0.5));
      const x0 = Math.floor(sx);
      const fx = sx - x0;
      const i00 = (y0 * src.w + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + src.w * 4;
      const i11 = i01 + 4;
      const o = (y * outW + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = src.data[i00 + c] * (1 - fx) + src.data[i10 + c] * fx;
        const bot = src.data[i01 + c] * (1 - fx) + src.data[i11 + c] * fx;
        out[o + c] = top * (1 - fy) + bot * fy;
      }
      out[o + 3] = 255;
    }
  }
  return { w: outW, h: outH, data: out };
}

/** Separable box blur, repeated for a smooth gaussian-like result. */
function boxBlur(r: Raster, radius: number, passes: number): void {
  const { w, h, data } = r;
  const tmp = new Float32Array(w * h * 4);
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < h; y++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let x = -radius; x <= radius; x++) sum += data[(y * w + Math.min(w - 1, Math.max(0, x))) * 4 + c];
        for (let x = 0; x < w; x++) {
          tmp[(y * w + x) * 4 + c] = sum / (radius * 2 + 1);
          const add = Math.min(w - 1, x + radius + 1);
          const sub = Math.max(0, x - radius);
          sum += data[(y * w + add) * 4 + c] - data[(y * w + sub) * 4 + c];
        }
      }
    }
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let y = -radius; y <= radius; y++) sum += tmp[(Math.min(h - 1, Math.max(0, y)) * w + x) * 4 + c];
        for (let y = 0; y < h; y++) {
          data[(y * w + x) * 4 + c] = sum / (radius * 2 + 1);
          const add = Math.min(h - 1, y + radius + 1);
          const sub = Math.max(0, y - radius);
          sum += tmp[(add * w + x) * 4 + c] - tmp[(sub * w + x) * 4 + c];
        }
      }
    }
  }
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** A vivid accent colour taken from the flyer: saturation-weighted average, pushed to a readable brightness. */
function accentFrom(r: Raster): string {
  let wr = 0, wg = 0, wb = 0, wt = 0;
  for (let i = 0; i < r.data.length; i += 4) {
    const R = r.data[i], G = r.data[i + 1], B = r.data[i + 2];
    const max = Math.max(R, G, B), min = Math.min(R, G, B);
    const v = max / 255;
    const sat = max === 0 ? 0 : (max - min) / max;
    if (v < 0.25 || sat < 0.25) continue;
    const wgt = sat * sat * v;
    wr += R * wgt; wg += G * wgt; wb += B * wgt; wt += wgt;
  }
  if (wt < 1) return GOLD;
  let R = wr / wt, G = wg / wt, B = wb / wt;
  // lift to a bright, saturated accent so lines and glows stay visible on the dark glass
  const max = Math.max(R, G, B);
  const k = 235 / max;
  R *= k; G *= k; B *= k;
  const avg = (R + G + B) / 3;
  R = avg + (R - avg) * 1.15; G = avg + (G - avg) * 1.15; B = avg + (B - avg) * 1.15;
  return toHex(R, G, B);
}

const smooth = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

interface Backdrop {
  dataUrl: string;
  accent: string;
}

/**
 * W x H in PDF points. The sharp flyer fills the top `flyerH` points and fades out between
 * `fadeFrom` and `flyerH`; everything below is a blurred, darkened, accent-boosted copy.
 */
function buildBackdrop(flyer: { buffer: Buffer; type: string }, W: number, H: number, flyerH: number, fadeFrom: number): Backdrop | null {
  const src = decodeRaster(flyer.buffer, flyer.type);
  if (!src) return null;
  const S = 2; // pixels per point
  const outW = W * S;
  const outH = H * S;

  // sharp layer (top of the flyer, full resolution)
  const sharp = coverSample(src, outW, flyerH * S, 0.1);

  // blurred base: sample small, blur, then scale up
  const smallW = Math.round(W / 4);
  const smallH = Math.round(H / 4);
  const small = coverSample(src, smallW, smallH, 0.25);
  const accent = accentFrom(small);
  boxBlur(small, 4, 3);
  const base = coverSample(small, outW, outH, 0.5);

  // darken a little (readability) and boost colour so the glass feels rich, not muddy
  for (let i = 0; i < base.data.length; i += 4) {
    const px = i / 4;
    const yp = Math.floor(px / outW) / S;
    const xp = (px % outW) / S;
    // darker toward the bottom and the sides: an even, rich base with no bright patches
    const down = smooth((yp - flyerH * 0.6) / (H - flyerH * 0.6));
    const side = Math.abs(xp - W / 2) / (W / 2);
    const factor = 0.62 - 0.2 * down - 0.08 * side * side;
    const R = base.data[i], G = base.data[i + 1], B = base.data[i + 2];
    const avg = (R + G + B) / 3;
    const boost = 1.28;
    // tone down bright areas (white robes, light flyer margins) so the base stays rich and even
    const lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
    const calm = 1 - 0.55 * smooth((lum - 0.28) / 0.45);
    const f = factor * calm;
    base.data[i] = Math.min(255, (avg + (R - avg) * boost) * f);
    base.data[i + 1] = Math.min(255, (avg + (G - avg) * boost) * f);
    base.data[i + 2] = Math.min(255, (avg + (B - avg) * boost) * f);
  }

  const out = new Uint8Array(outW * outH * 4);
  for (let y = 0; y < outH; y++) {
    const yp = y / S;
    const keep = yp >= flyerH ? 0 : 1 - smooth((yp - fadeFrom) / (flyerH - fadeFrom));
    for (let x = 0; x < outW; x++) {
      const o = (y * outW + x) * 4;
      for (let c = 0; c < 3; c++) {
        const b = base.data[o + c];
        out[o + c] = keep > 0 ? sharp.data[(Math.min(y, sharp.h - 1) * outW + x) * 4 + c] * keep + b * (1 - keep) : b;
      }
      out[o + 3] = 255;
    }
  }
  const encoded = jpeg.encode({ data: out, width: outW, height: outH }, 84);
  return { dataUrl: `data:image/jpeg;base64,${Buffer.from(encoded.data).toString("base64")}`, accent };
}

/* =====================================================================
   Vertical ticket (default): shaped like a phone screen so it can be
   downloaded or screenshotted and shown at the gate.
   ===================================================================== */
const P_W = 360;
const P_M = 14;
const CARD_W = P_W - P_M * 2;
const CARD_H = 650;
const P_H = CARD_H + P_M * 2;
const FLYER_H = 262; // sharp flyer region (fully faded out by this line)
const FADE_FROM = 84;
const PANEL_X = 14;
const PANEL_Y = 206;
const PANEL_W = CARD_W - PANEL_X * 2;
const PANEL_H = CARD_H - PANEL_Y - 14;
const PAGE_BG = "#08080a";

const ps = StyleSheet.create({
  page: { backgroundColor: PAGE_BG, padding: P_M },
  card: { width: CARD_W, height: CARD_H, borderRadius: 22, overflow: "hidden", backgroundColor: "#111115", position: "relative" },
  head: { position: "absolute", top: 0, left: 0, width: CARD_W, height: 64, paddingHorizontal: 18, paddingTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badge: { fontFamily: FONT.body, fontWeight: FONT.heavy, fontSize: 8, letterSpacing: 1.4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  panel: { position: "absolute", top: PANEL_Y, left: PANEL_X, width: PANEL_W, height: PANEL_H, paddingHorizontal: 20, paddingTop: 20 },
  title: { fontFamily: FONT.body, fontWeight: FONT.heavy, fontSize: 21, color: "#ffffff", lineHeight: 1.18 },
  rule: { width: 36, height: 3, borderRadius: 2, marginTop: 11, marginBottom: 13 },
  twoCol: { flexDirection: "row" },
  label: { fontFamily: FONT.body, fontWeight: FONT.heavy, fontSize: 7, letterSpacing: 1.8, color: "#c9c9d2", opacity: 0.8, marginBottom: 3 },
  value: { fontFamily: FONT.body, fontWeight: FONT.semi, fontSize: 11.5, color: "#ffffff", lineHeight: 1.3 },
  holderName: { fontFamily: FONT.body, fontWeight: FONT.heavy, fontSize: 14.5, color: "#ffffff" },
  qrWrap: { alignItems: "center", marginTop: 4 },
  qrBox: { backgroundColor: "#ffffff", padding: 8, borderRadius: 14 },
  refPill: { marginTop: 11, paddingVertical: 5, paddingHorizontal: 14, borderRadius: 14 },
  refText: { fontFamily: FONT.mono, fontWeight: 700, fontSize: 12, letterSpacing: 0.5 },
  foot: { fontFamily: FONT.body, fontWeight: FONT.regular, fontSize: 6.5, color: "#d4d4dc", opacity: 0.7, marginTop: 8, textAlign: "center" },
});

const TicketPdfPortrait: React.FC<TicketPdfProps> = ({ event, attendee, ticket, qrDataUrl, logoDataUrl, logoFullDataUrl, backdropDataUrl, accent }) => {
  const tier = tierFor(ticket.ticketTypeName);
  const glow = accent || GOLD;
  const start = new Date(event.startsAt);
  const dateStr = start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric", timeZone: event.timezone });
  const timeStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: event.timezone });
  const title = event.title.length > 58 ? event.title.slice(0, 55) + "..." : event.title;

  return (
    <Document title={`${event.title} - ${ticket.visibleRef}`}>
      <Page size={[P_W, P_H]} style={ps.page}>
        <View style={ps.card}>
          {/* ---------- background: flyer dissolving into a blurred, tinted base ---------- */}
          {backdropDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={backdropDataUrl} style={{ position: "absolute", top: 0, left: 0, width: CARD_W, height: CARD_H }} />
          ) : (
            <Svg width={CARD_W} height={CARD_H} style={{ position: "absolute", top: 0, left: 0 }}>
              <Defs>
                <LinearGradient id="plain" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={glow} stopOpacity={0.35} />
                  <Stop offset="0.45" stopColor="#15151b" stopOpacity={1} />
                  <Stop offset="1" stopColor="#0d0d11" stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={CARD_W} height={CARD_H} fill="url(#plain)" />
            </Svg>
          )}
          {!backdropDataUrl && logoDataUrl && (
            <View style={{ position: "absolute", top: 58, left: 0, width: CARD_W, alignItems: "center" }}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={logoDataUrl} style={{ width: 72, height: 93 }} />
            </View>
          )}

          {backdropDataUrl && (
            <>
            {/* soft shade behind the logo so it stays readable on any flyer */}
            <Svg width={CARD_W} height={90} style={{ position: "absolute", top: 0, left: 0 }}>
              <Defs>
                <LinearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#000000" stopOpacity={0.7} />
                  <Stop offset="1" stopColor="#000000" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={CARD_W} height={90} fill="url(#topShade)" />
            </Svg>
            </>
          )}

          {/* ---------- brand bar ---------- */}
          <View style={ps.head}>
            {logoFullDataUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoFullDataUrl} style={{ width: 99, height: 32 }} />
            ) : (
              <Text style={{ fontFamily: FONT.body, fontWeight: FONT.heavy, fontSize: 13, color: GOLD, letterSpacing: 2 }}>EVENTHENE</Text>
            )}
            <Text style={[ps.badge, { backgroundColor: tier.badgeBg, color: tier.badgeText }]}>{tier.label.toUpperCase()}</Text>
          </View>

          {/* ---------- frosted glass panel ---------- */}
          <Svg width={PANEL_W} height={PANEL_H} style={{ position: "absolute", top: PANEL_Y, left: PANEL_X }}>
            <Rect x="0.5" y="0.5" width={PANEL_W - 1} height={PANEL_H - 1} rx="18" ry="18" fill="#07070a" fillOpacity={0.68} />
            <Rect x="0.5" y="0.5" width={PANEL_W - 1} height={PANEL_H - 1} rx="18" ry="18" fill="none" stroke={glow} strokeOpacity={0.55} strokeWidth={1} />
            <Rect x="1.5" y="1.5" width={PANEL_W - 3} height={26} rx="16" ry="16" fill="#ffffff" fillOpacity={0.05} />
          </Svg>

          <View style={ps.panel}>
            <Text style={ps.title}>{title}</Text>
            <View style={[ps.rule, { backgroundColor: glow }]} />

            <View style={ps.twoCol}>
              <View style={{ flex: 1.35 }}>
                <Text style={ps.label}>DATE</Text>
                <Text style={ps.value}>{dateStr}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ps.label}>TIME</Text>
                <Text style={ps.value}>{timeStr}</Text>
              </View>
            </View>

            <View style={{ marginTop: 11 }}>
              <Text style={ps.label}>VENUE</Text>
              <Text style={ps.value}>{event.venue}</Text>
            </View>

            <View style={{ marginTop: 11 }}>
              <Text style={ps.label}>ADMIT ONE</Text>
              <Text style={ps.holderName}>{attendee.fullName}</Text>
            </View>

            <Svg width={PANEL_W - 40} height={18} style={{ marginTop: 10 }}>
              <Line x1="0" y1="9" x2={PANEL_W - 40} y2="9" stroke="#ffffff" strokeOpacity={0.28} strokeWidth={1} strokeDasharray="4 4" />
            </Svg>

            <View style={ps.qrWrap}>
              <View style={[ps.qrBox, { borderWidth: 3, borderColor: tier.accent }]}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={qrDataUrl} style={{ width: 118, height: 118 }} />
              </View>
              <View style={[ps.refPill, { backgroundColor: tier.accent }]}>
                <Text style={[ps.refText, { color: tier.badgeText }]}>{ticket.visibleRef}</Text>
              </View>
              <Text style={ps.foot}>One entry. Non-transferable. Powered by EventHene</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

/** react-pdf only supports JPEG and PNG. Anything else (or a slow/failed fetch) falls back to no flyer. */
async function fetchFlyer(url: string | null): Promise<{ buffer: Buffer; type: string } | null> {
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
    if (buf.length > 4_000_000) return null;
    return { buffer: buf, type };
  } catch {
    return null;
  }
}

function flyerAsDataUrl(f: { buffer: Buffer; type: string } | null): string | null {
  return f ? `data:${f.type};base64,${f.buffer.toString("base64")}` : null;
}

const publicImageCache = new Map<string, string | null>();

/** Loads an image from /public as a data URL: from disk first, from the site itself as a fallback. */
async function publicImage(name: string): Promise<string | null> {
  if (publicImageCache.has(name)) return publicImageCache.get(name)!;
  let result: string | null = null;
  try {
    const file = path.join(process.cwd(), "public", name);
    result = `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
  } catch {
    try {
      const base = getAppUrl();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${base}/${name}`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) result = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
    } catch {
      // no logo image: the ticket falls back to the wordmark text
    }
  }
  publicImageCache.set(name, result);
  return result;
}

export type TicketLayout = "portrait" | "landscape";

export async function renderTicketPdfBuffer(ticketId: string, layout: TicketLayout = "portrait"): Promise<Buffer> {
  const ticket = await db.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { attendee: true, ticketType: true, event: true }
  });
  const payload = buildQrPayload(ticket.qrToken, ticket.eventId);
  const [qr, flyerRaw, logoDataUrl, logoFullDataUrl] = await Promise.all([
    qrToDataUrl(payload),
    fetchFlyer(ticket.event.flyerUrl),
    publicImage("logo-icon.png"),
    publicImage("logo-full.png"),
  ]);
  let backdrop: Backdrop | null = null;
  if (layout === "portrait" && flyerRaw) {
    try {
      backdrop = buildBackdrop(flyerRaw, CARD_W, CARD_H, FLYER_H, FADE_FROM);
    } catch (e) {
      console.error("[render] backdrop failed, using plain background", e);
    }
  }
  const flyerDataUrl = flyerAsDataUrl(flyerRaw);
  const element = React.createElement(layout === "landscape" ? TicketPdfLandscape : TicketPdfPortrait, {
    backdropDataUrl: backdrop?.dataUrl ?? null,
    accent: backdrop?.accent ?? null,
    event: ticket.event,
    attendee: ticket.attendee,
    ticket: { visibleRef: ticket.visibleRef, ticketTypeName: ticket.ticketType.name },
    qrDataUrl: qr,
    flyerDataUrl,
    logoDataUrl,
    logoFullDataUrl,
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
