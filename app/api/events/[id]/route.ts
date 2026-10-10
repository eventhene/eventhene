import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireEventOwner } from "@/lib/auth";

const TicketTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(60),
  priceMinor: z.number().int().min(0),
  quantity: z.number().int().min(1),
  notes: z.string().max(200).nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const AttendeeFieldSchema = z.object({
  key: z.enum(["FULL_NAME", "PHONE", "EMAIL", "GENDER", "CITY", "ADDRESS", "ORGANIZATION", "AGE_RANGE", "EMERGENCY_CONTACT", "CUSTOM"]),
  label: z.string().min(1).max(100),
  type: z.enum(["TEXT", "EMAIL", "PHONE", "SELECT", "NUMBER", "DATE", "TEXTAREA"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  sortOrder: z.number().int().default(0),
});

const EditEventBody = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(10000),
  category: z.string().max(50),
  venue: z.string().min(1).max(200),
  city: z.string().max(100).nullish(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  bookingOpensAt: z.coerce.date(),
  bookingClosesAt: z.coerce.date(),
  flyerUrl: z.string().url().nullish().or(z.literal("")),
  type: z.enum(["PAID", "FREE"]),
  buyerPaysFee: z.boolean(),
  welcomeSms: z.boolean().default(true),
  collectBuyerInfo: z.boolean().optional(),
  ticketTypes: z.array(TicketTypeSchema).min(1).max(20),
  attendeeFields: z.array(AttendeeFieldSchema).min(1).max(30),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { event } = await requireEventOwner(params.id, req);
    const body = EditEventBody.parse(await req.json());

    if (body.endsAt <= body.startsAt) {
      return NextResponse.json({ error: "The event must end after it starts." }, { status: 400 });
    }
    if (body.bookingClosesAt > body.endsAt) {
      return NextResponse.json({ error: "Ticket sales cannot close after the event ends." }, { status: 400 });
    }

    const orderCount = await db.order.count({ where: { eventId: event.id } });
    if (orderCount > 0 && body.type !== event.type) {
      return NextResponse.json(
        { error: "You cannot switch between paid and free after tickets have been ordered." },
        { status: 400 }
      );
    }
    if (body.type === "FREE" && body.ticketTypes.some((t) => t.priceMinor !== 0)) {
      return NextResponse.json({ error: "Free events cannot have priced tickets." }, { status: 400 });
    }

    const existing = await db.ticketType.findMany({
      where: { eventId: event.id },
      include: { _count: { select: { tickets: true } } },
    });
    const existingById = new Map(existing.map((t) => [t.id, t]));

    for (const t of body.ticketTypes) {
      if (!t.id) continue;
      const current = existingById.get(t.id);
      if (!current) return NextResponse.json({ error: "Unknown ticket type." }, { status: 400 });
      if (t.quantity < current.sold) {
        return NextResponse.json(
          { error: `"${current.name}" already has ${current.sold} sold, so quantity cannot go below that.` },
          { status: 400 }
        );
      }
    }

    const keepIds = new Set(body.ticketTypes.filter((t) => t.id).map((t) => t.id as string));

    // Free events that were sent back for edits go back into review once edited.
    let nextStatus = event.status;
    if (event.type === "FREE" && (event.status === "EDITS_REQUESTED" || event.status === "REJECTED")) {
      nextStatus = "PENDING_APPROVAL";
    }

    const updated = await db.$transaction(async (tx) => {
      // Ticket types removed from the form: delete if never sold, otherwise just hide.
      for (const t of existing) {
        if (keepIds.has(t.id)) continue;
        if (t.sold === 0 && t._count.tickets === 0) {
          await tx.ticketType.delete({ where: { id: t.id } });
        } else {
          await tx.ticketType.update({ where: { id: t.id }, data: { isActive: false } });
        }
      }

      for (const t of body.ticketTypes) {
        const data = {
          name: t.name.trim(),
          priceMinor: body.type === "FREE" ? 0 : t.priceMinor,
          quantity: t.quantity,
          notes: t.notes || null,
          isActive: t.isActive,
          sortOrder: t.sortOrder,
        };
        if (t.id) await tx.ticketType.update({ where: { id: t.id }, data });
        else await tx.ticketType.create({ data: { ...data, eventId: event.id } });
      }

      await tx.attendeeField.deleteMany({ where: { eventId: event.id } });
      await tx.attendeeField.createMany({
        data: body.attendeeFields.map((f, idx) => ({
          eventId: event.id,
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
          options: f.options ?? [],
          sortOrder: idx,
        })),
      });

      return tx.event.update({
        where: { id: event.id },
        data: {
          title: body.title.trim(),
          description: body.description,
          category: body.category,
          venue: body.venue,
          city: body.city || null,
          startsAt: body.startsAt,
          endsAt: body.endsAt,
          bookingOpensAt: body.bookingOpensAt,
          bookingClosesAt: body.bookingClosesAt,
          flyerUrl: body.flyerUrl || null,
          type: body.type,
          buyerPaysFee: body.buyerPaysFee,
          welcomeSms: body.welcomeSms,
          ...(body.collectBuyerInfo !== undefined && { collectBuyerInfo: body.collectBuyerInfo }),
          status: nextStatus,
        },
      });
    });

    return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
  } catch (e: any) {
    if (e?.name === "UnauthorizedError") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (e?.name === "ForbiddenError") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Please check the highlighted details and try again." }, { status: 400 });
    console.error("[events PATCH]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
