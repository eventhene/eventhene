import Link from "next/link";

export const metadata = { title: "Services" };

export default function OrgServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Creative extras</p>
        <h1 className="h-section mt-1">Services</h1>
      </div>
      <div className="card p-8">
        <p className="text-ink-muted mb-4">
          Need graphic design, social media promo, livestream, photography, or media coverage? Submit a request and we'll get back within 24 hours.
        </p>
        <Link href="/services" className="btn-primary btn-md">Request a service</Link>
      </div>
    </div>
  );
}
