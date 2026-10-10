"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, User, Building2 } from "lucide-react";

interface Props {
  user: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    role: string;
  };
  organizer: {
    id: string;
    displayName: string;
    slug: string;
    bio: string | null;
    website: string | null;
  } | null;
}

export function SettingsForm({ user, organizer }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");

  const [displayName, setDisplayName] = useState(organizer?.displayName ?? "");
  const [bio, setBio] = useState(organizer?.bio ?? "");
  const [website, setWebsite] = useState(organizer?.website ?? "");

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          phone: phone.trim() || null,
          displayName: displayName.trim() || undefined,
          bio: bio.trim() || null,
          website: website.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save." });
      } else {
        setMessage({ type: "success", text: "Settings saved." });
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Account</h2>
        </div>
        <div className="card-glass rounded-2xl p-6 space-y-4">
          <Field label="Email" value={user.email} disabled hint="Change it under Sign-in security below" />
          <Field label="Role" value={user.role} disabled />
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input text-white w-full"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input text-white w-full"
              placeholder="+233..."
            />
          </div>
        </div>
      </section>

      {organizer && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Organizer profile</h2>
          </div>
          <div className="card-glass rounded-2xl p-6 space-y-4">
            <Field label="Public URL" value={`/@${organizer.slug}`} disabled hint="Auto-generated from name" />
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input text-white w-full"
                placeholder="Organization or brand name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input text-white w-full resize-none"
                rows={3}
                placeholder="A short description of your organization"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input text-white w-full"
                placeholder="https://yoursite.com"
              />
            </div>
          </div>
        </section>
      )}

      {message && (
        <p className={`text-sm font-medium ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      <button onClick={handleSave} disabled={saving} className="btn-gold btn-md w-full sm:w-auto">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}

function Field({ label, value, disabled, hint }: { label: string; value: string; disabled?: boolean; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 mb-1.5">{label}</label>
      <input type="text" value={value} disabled className="input text-white w-full opacity-60 cursor-not-allowed" />
      {hint && <p className="text-[11px] text-white/30 mt-1">{hint}</p>}
    </div>
  );
}
