export const metadata = { title: "Scanner staff" };

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Scanner access</p>
        <h1 className="h-section mt-1">Staff</h1>
      </div>
      <div className="card p-10 text-center text-ink-muted">
        <p>Invite teammates to scan tickets at the gate.</p>
        <p className="text-xs mt-2">Coming next: email invite + per-event staff assignment.</p>
      </div>
    </div>
  );
}
