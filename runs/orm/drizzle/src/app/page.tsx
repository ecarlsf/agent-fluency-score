import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Welcome to ProjectHub
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        A project management app built with Next.js and shadcn/ui.
        Track projects, manage tasks, and collaborate with your team.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/projects">Projects</Link>
        </Button>
      </div>
    </div>
  );
}
