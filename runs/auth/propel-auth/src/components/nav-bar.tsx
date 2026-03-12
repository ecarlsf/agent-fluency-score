"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  useUser,
  useLogoutFunction,
  useRedirectFunctions,
  useHostedPageUrls,
} from "@propelauth/nextjs/client";

const protectedPaths = ["/dashboard", "/settings"];

export function NavBar() {
  const { loading, user } = useUser();
  const logout = useLogoutFunction();
  const { redirectToLoginPage, redirectToSignupPage, redirectToCreateOrgPage } = useRedirectFunctions();
  const { getOrgPageUrl } = useHostedPageUrls();
  const pathname = usePathname();
  const router = useRouter();
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (user) {
      wasLoggedIn.current = true;
    }
  }, [user]);

  // Redirect to /login if session expires on a protected page
  useEffect(() => {
    if (loading) return;
    const isProtected = protectedPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isProtected && !user && wasLoggedIn.current) {
      wasLoggedIn.current = false;
      router.push("/login");
    }
  }, [loading, user, pathname, router]);

  return (
    <nav className="border-b">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
        <Link href="/" className="mr-4 font-semibold">
          Starter App
        </Link>
        {user && (
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
          {loading ? null : user ? (
            <>
              {(() => {
                const orgs = user.getOrgs();
                if (orgs.length > 0) {
                  return (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={getOrgPageUrl(orgs[0].orgId)}>
                        {orgs[0].orgName}
                      </a>
                    </Button>
                  );
                }
                return (
                  <Button variant="ghost" size="sm" onClick={() => redirectToCreateOrgPage()}>
                    Create organization
                  </Button>
                );
              })()}
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => redirectToLoginPage()}>
                Log in
              </Button>
              <Button size="sm" onClick={() => redirectToSignupPage()}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
