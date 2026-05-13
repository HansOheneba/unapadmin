import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unapologetic Admin",
  description: "Admin dashboard for the Unapologetic brand",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
