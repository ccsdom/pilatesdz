import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Pilates Center Alger · Sculptfit Studio",
  description: "Studio d'exception Pilates Reformer & Sol à Bir Mourad Raïs, Alger. Force, équilibre et bien-être.",
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
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}


