import React from "react";
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { buildQrPayload, qrToDataUrl } from "@/lib/qr";
import { uploadTicketPdf } from "@/lib/storage";

const s = StyleSheet.create({
  page: { backgroundColor: "#0F0E13", color: "#FAFAF7", padding: 24, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  brand: { fontSize: 11, letterSpacing: 2, color: "#D4A24C" },
  hero: { marginVertical: 12, height: 240, borderRadius: 8, overflow: "hidden" },
  heroBg: { backgroundColor: "#4B1E78", height: 240, justifyContent: "center", alignItems: "center", borderRadius: 8 },
  title: { fontSize: 22, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  meta: { fontSize: 10, color: "#D4A24C", marginBottom: 16 },
  divider: { borderTop: 1, borderColor: "#5B5666", borderStyle: "dashed", marginVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  label: { fontSize: 8, color: "#5B5666", textTransform: "uppercase", marginBottom: 2 },
  value: { fontSize: 13, color: "#FAFAF7" },
  ref: { fontSize: 16, fontFamily: "Courier", color: "#D4A24C" },
  qrBox: { backgroundColor: "white", padding: 10, alignSelf: "center", borderRadius: 8, marginTop: 8 },
  footer: { fontSize: 8, textAlign: "center", marginTop: 12, color: "#5B5666" }
});

interface TicketPdfProps {
  event: { title: string; venue: string; flyerUrl: string | null; timezone: string; startsAt: Date };
  attendee: { fullName: string };
  ticket: { visibleRef: string; ticketTypeName: string };
  qrDataUrl: string;
}

const TicketPdf: React.FC<TicketPdfProps> = ({ event, attendee, ticket, qrDataUrl }) => (
  <Document>
    <Page size="A6" style={s.page}>
      <View style={s.header}>
        <Text style={s.brand}>EVENT • HENE</Text>
        <Text style={s.brand}>{ticket.ticketTypeName.toUpperCase()}</Text>
      </View>

      {event.flyerUrl ? (
        <View style={s.hero}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={event.flyerUrl} style={{ width: "100%", height: 240, objectFit: "cover" }} />
        </View>
      ) : (
        <View style={s.heroBg}>
          <Text style={{ fontSize: 18, color: "#D4A24C" }}>♛</Text>
        </View>
      )}

      <Text style={s.title}>{event.title}</Text>
      <Text style={s.meta}>
        {new Date(event.startsAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: event.timezone })}
        {"   "}•{"   "}{event.venue}
      </Text>

      <View style={s.divider} />

      <View style={s.row}>
        <View>
          <Text style={s.label}>Attendee</Text>
          <Text style={s.value}>{attendee.fullName}</Text>
        </View>
        <View>
          <Text style={s.label}>Reference</Text>
          <Text style={s.ref}>{ticket.visibleRef}</Text>
        </View>
      </View>

      <View style={s.qrBox}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={qrDataUrl} style={{ width: 160, height: 160 }} />
      </View>

      <Text style={s.footer}>Show this code at entry. Non-transferable. Powered by EventHene ♛</Text>
    </Page>
  </Document>
);

export async function renderTicketPdfBuffer(ticketId: string): Promise<Buffer> {
  const ticket = await db.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { attendee: true, ticketType: true, event: true }
  });
  const payload = buildQrPayload(ticket.qrToken, ticket.eventId);
  const qr = await qrToDataUrl(payload);
  const element = React.createElement(TicketPdf, {
    event: ticket.event,
    attendee: ticket.attendee,
    ticket: { visibleRef: ticket.visibleRef, ticketTypeName: ticket.ticketType.name },
    qrDataUrl: qr
  });
  // @ts-ignore react-pdf typings
  return renderToBuffer(element);
}

export async function renderAndStoreTicketPdfs(ticketIds: string[]): Promise<void> {
  for (const id of ticketIds) {
    try {
      const buf = await renderTicketPdfBuffer(id);
      const url = await uploadTicketPdf(id, buf);
      await db.ticket.update({ where: { id }, data: { pdfUrl: url } });
    } catch (e) {
      console.error("[render] failed for ticket", id, e);
    }
  }
}
