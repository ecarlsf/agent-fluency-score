import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth0 } from "@/lib/auth0";
import { getRequiredUser } from "@/lib/auth";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();
  const user = session ? await getRequiredUser() : null;
  const orgName = user?.organization?.name ?? null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b">
          <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
            <Link href="/" className="mr-4 font-semibold">
              Starter App
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            {session ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/settings">Settings</Link>
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  {orgName && (
                    <span className="text-sm font-medium">{orgName}</span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {session.user.email}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/auth/logout">Log out</a>
                  </Button>
                </div>
              </>
            ) : (
              <div className="ml-auto">
                <Button variant="outline" size="sm" asChild>
                  <a href="/auth/login">Log in</a>
                </Button>
              </div>
            )}
          </div>
        </nav>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
