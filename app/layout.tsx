import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: { default: "EventHene — Run a kingly event", template: "%s • EventHene" },
  description:
    "Premium event ticketing, registration, attendance tracking & promotion for organizers in Ghana and beyond.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "EventHene — Run a kingly event",
    description:
      "Sell tickets, track attendance, grow your event. Free to publish. 5% per paid ticket.",
    type: "website",
    siteName: "EventHene"
  },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#4B1E78",
          colorText: "#0F0E13",
          colorBackground: "#FAFAF7",
          borderRadius: "0.875rem",
          fontFamily: "Inter, system-ui, sans-serif"
        }
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
