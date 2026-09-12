import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pilates Center Alger",
  description: "Identité visuelle de Pilates Center Alger : force, équilibre et bien-être.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
