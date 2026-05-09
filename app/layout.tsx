import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Piano Roll Workspace",
  description: "A minimal grid sequencer with click-to-place notes and Tone.js playback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
