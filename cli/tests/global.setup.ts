import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

setup.describe.configure({ mode: "serial" });

setup("global setup", async ({}) => {
  const appDir = process.env.APP_DIR;
  if (!appDir) return;

  // Read the app's .env to get Clerk keys for testing token
  const envPath = path.resolve(appDir, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^(CLERK_\w+|NEXT_PUBLIC_CLERK_\w+)=(.+)$/);
      if (match) {
        process.env[match[1]] = match[2].trim();
      }
    }
  }

  // clerkSetup() needs CLERK_PUBLISHABLE_KEY but Next.js apps use NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.CLERK_PUBLISHABLE_KEY) {
    process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }

  const toolName = process.env.TOOL_NAME || "";
  if (toolName === "clerk") {
    await clerkSetup();
  }
});
