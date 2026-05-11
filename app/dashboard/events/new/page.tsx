import { CreateEventForm } from "@/components/dashboard/CreateEventForm";
import { requireOrganizer } from "@/lib/auth";

export const metadata = { title: "Create an event" };

export default async function NewEventPage() {
  const { organizer, user } = await requireOrganizer();
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="h-display text-3xl mb-1">Create your event</h1>
      <p className="text-ink-muted mb-6">Publish in 5 minutes. Edit anything later.</p>
      <CreateEventForm
        defaultCountry={user.country ?? "GH"}
        defaultCurrency={user.currency ?? "GHS"}
        defaultTimezone={user.timezone ?? "Africa/Accra"}
      />
    </div>
  );
}
