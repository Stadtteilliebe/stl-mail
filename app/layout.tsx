import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Dieselbe Schrift wie in stl-inside/stl-prism (app/fonts/), damit alle
// drei internen Apps optisch zusammengehören statt Geist zu nutzen.
const averta = localFont({
  variable: "--font-averta",
  src: [
    { path: "./fonts/AvertaStd-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/AvertaStd-Semibold.otf", weight: "700", style: "normal" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "stl mail",
  description: "Mail Templates aus Notion bauen und testen",
};

// Bewusst nur Fonts/globales CSS — die Sidebar lebt in (shell)/layout.tsx,
// nicht hier, damit Seiten außerhalb dieser Gruppe (Templates/Komponenten
// bearbeiten) als voller Screen ohne Sidebar laufen koennen. Gleiches Muster
// wie stl-inside (app/tickets/new liegt bewusst außerhalb von (portal)).
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${averta.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
