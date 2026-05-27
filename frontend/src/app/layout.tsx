import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AoS Morning Brief",
  description: "CEO-facing AI Chief of Staff triage dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
