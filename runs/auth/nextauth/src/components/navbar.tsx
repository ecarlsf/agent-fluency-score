"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
        <Link href="/" className="mr-4 font-semibold">
          Starter App
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">Home</Link>
        </Button>
        {session && (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings">Settings</Link>
            </Button>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {status === "loading" ? null : session ? (
            <>
              {session.user?.orgName && (
                <span className="text-sm font-medium">
                  {session.user.orgName}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {session.user?.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
