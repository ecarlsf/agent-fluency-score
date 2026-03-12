import type { Metadata } from "next";
import localFont from "next/font/local";
import AuthSessionProvider from "@/components/session-provider";
import Navbar from "@/components/navbar";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Starter App",
  description: "Next.js starter app with Prisma and shadcn/ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <Navbar />
          <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
