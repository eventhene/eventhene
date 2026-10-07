import { CreateEventForm } from "@/components/dashboard/CreateEventForm";
import { requireOrganizer } from "@/lib/auth";

export const metadata = { title: "Create an event" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireOrganizer();
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-ink-muted">New event</p>
        <h1 className="h-section mt-1">Create your event.</h1>
        <p className="text-ink-muted mt-2">Publish in 5 minutes. Edit anything later.</p>
      </div>
      <CreateEventForm />
    </div>
  );
}
