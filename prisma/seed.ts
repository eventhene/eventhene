import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding EventHene…");

  // Promo prices (Ghana)
  const promos = [
    { country: "GH", tier: "BASIC_BOOST" as const, priceMinor: 3900, currency: "GHS", durationDays: 7 },
    { country: "GH", tier: "FEATURED" as const, priceMinor: 9900, currency: "GHS", durationDays: 7 },
    { country: "GH", tier: "HOMEPAGE_SPOTLIGHT" as const, priceMinor: 19900, currency: "GHS", durationDays: 3 },
    { country: "GH", tier: "CATEGORY_FEATURE" as const, priceMinor: 7900, currency: "GHS", durationDays: 7 },
    // Nigeria
    { country: "NG", tier: "BASIC_BOOST" as const, priceMinor: 500000, currency: "NGN", durationDays: 7 },
    { country: "NG", tier: "FEATURED" as const, priceMinor: 1500000, currency: "NGN", durationDays: 7 }
  ];
  for (const p of promos) {
    await db.promoPrice.upsert({
      where: { country_tier: { country: p.country, tier: p.tier } },
      update: p,
      create: p
    });
  }

  // Sample user — Clerk webhook would normally create this; we seed a placeholder
  const sampleUser = await db.user.upsert({
    where: { email: "demo-organizer@eventhene.local" },
    update: {},
    create: {
      clerkId: "seed_organizer_user",
      email: "demo-organizer@eventhene.local",
      fullName: "Kojo Mensah (demo)",
      role: "ORGANIZER",
      country: "GH",
      currency: "GHS",
      timezone: "Africa/Accra"
    }
  });

  const sampleOrg = await db.organizer.upsert({
    where: { userId: sampleUser.id },
    update: {},
    create: {
      userId: sampleUser.id,
      displayName: "DJ Kay Live",
      slug: "dj-kay-live",
      phoneVerified: true
    }
  });

  // Sample paid event
  const existing = await db.event.findUnique({ where: { slug: "dj-kay-birthday-bash" } });
  if (!existing) {
    await db.event.create({
      data: {
        organizerId: sampleOrg.id,
        title: "DJ Kay Birthday Bash",
        slug: "dj-kay-birthday-bash",
        shortCode: "DJKAY",
        description:
          "The biggest birthday set of the year. Live performances, surprise guests, VIP table service. Don't miss it.",
        category: "Music",
        venue: "Front Back, East Legon, Accra",
        city: "Accra",
        country: "GH",
        currency: "GHS",
        timezone: "Africa/Accra",
        startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 6),
        bookingOpensAt: new Date(),
        bookingClosesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 29),
        flyerUrl: "https://placehold.co/1080x1350/4B1E78/D4A24C/png?text=DJ+KAY+%E2%99%9B",
        type: "PAID",
        status: "PUBLISHED",
        publishedAt: new Date(),
        buyerPaysFee: true,
        ticketTypes: {
          create: [
            { name: "Regular", priceMinor: 15000, quantity: 300, sortOrder: 1 },
            { name: "VIP", priceMinor: 35000, quantity: 100, sortOrder: 2, notes: "Includes welcome drink" },
            { name: "VVIP", priceMinor: 80000, quantity: 30, sortOrder: 3, notes: "Table service for 4" }
          ]
        },
        attendeeFields: {
          create: [
            { key: "FULL_NAME", label: "Full name", type: "TEXT", required: true, sortOrder: 1 },
            { key: "PHONE", label: "Phone number", type: "PHONE", required: true, sortOrder: 2 },
            { key: "EMAIL", label: "Email", type: "EMAIL", required: true, sortOrder: 3 },
            { key: "CITY", label: "City", type: "TEXT", required: false, sortOrder: 4 }
          ]
        }
      }
    });
  }

  // Sample free event awaiting approval
  const existingFree = await db.event.findUnique({ where: { slug: "kingdom-praise-night" } });
  if (!existingFree) {
    await db.event.create({
      data: {
        organizerId: sampleOrg.id,
        title: "Kingdom Praise Night",
        slug: "kingdom-praise-night",
        shortCode: "PRAISE",
        description: "An evening of worship and prayer. Free entry — first come, first served.",
        category: "Faith",
        venue: "Cathedral, Accra",
        city: "Accra",
        country: "GH",
        currency: "GHS",
        timezone: "Africa/Accra",
        startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45 + 1000 * 60 * 60 * 3),
        bookingOpensAt: new Date(),
        bookingClosesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 44),
        type: "FREE",
        status: "PENDING_APPROVAL",
        ticketTypes: {
          create: [{ name: "General Admission", priceMinor: 0, quantity: 800, sortOrder: 1 }]
        },
        attendeeFields: {
          create: [
            { key: "FULL_NAME", label: "Full name", type: "TEXT", required: true, sortOrder: 1 },
            { key: "PHONE", label: "Phone", type: "PHONE", required: true, sortOrder: 2 }
          ]
        }
      }
    });
  }

  console.log("✓ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
