import { redirect } from "next/navigation";
import { requireUserOrRedirect, resolveOrganizerAccess } from "@/lib/auth";
import { ContactExport } from "@/components/dashboard/ContactExport";

export const metadata = { title: "Contacts" };
export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await requireUserOrRedirect("/dashboard/contacts");
  const ctx = await resolveOrganizerAccess(user.id);
  if (!ctx) redirect("/dashboard");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-white/40">Account</p>
        <h1 className="h-section mt-1 text-white">Contacts</h1>
        <p className="mt-2 max-w-2xl text-white/45">
          Everyone you hold in one place: the contacts you uploaded and the people who registered for
          your events. Export them with whichever columns your forms collected.
        </p>
      </div>
      <ContactExport />
    </div>
  );
}
