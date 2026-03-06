import { defineConfig } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const appDir = process.env.APP_DIR
  ? path.resolve(process.env.APP_DIR)
  : path.resolve(__dirname, "../../runs/auth/clerk");

export default defineConfig({
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results.json" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "tests",
      testDir: "./auth",
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    cwd: appDir,
    port: 3000,
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      ...process.env,
      NODE_ENV: "development",
    },
  },
});
