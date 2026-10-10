import { redirect } from "next/navigation";

// The per-event SMS page was replaced by the main SMS composer (contact lists, mixed audiences, history).
export default function EventSmsRedirect({ params }: { params: { id: string } }) {
  redirect(`/dashboard/sms/compose?event=${params.id}`);
}
