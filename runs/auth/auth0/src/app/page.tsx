import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth0 } from "@/lib/auth0";

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Welcome to the Starter App
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        A minimal Next.js application with PostgreSQL, Prisma, and shadcn/ui.
        Manage your posts and user settings from the dashboard.
      </p>
      {session ? (
        <Button asChild size="lg">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      ) : (
        <Button asChild size="lg">
          <a href="/auth/login">Log in to Get Started</a>
        </Button>
      )}
    </div>
  );
}
