import { Page } from "@playwright/test";

export interface AuthFlow {
  /** Navigate to sign-up, fill form, submit. Returns after authenticated. */
  signUp(page: Page, opts: { email: string; password: string }): Promise<void>;
  /** Navigate to sign-in, fill form, submit. Returns after authenticated. */
  signIn(page: Page, opts: { email: string; password: string }): Promise<void>;
  /** Find and click sign-out, wait for de-authentication. */
  signOut(page: Page): Promise<void>;
  /** Sign-in page URL path */
  signInPath: string;
  /** Sign-up page URL path */
  signUpPath: string;
}

export function generateTestEmail(): string {
  // +clerk_test subaddress enables Clerk's test OTP code "424242"
  // The subaddress is ignored by other auth providers
  return `benchmark+clerk_test${Date.now()}@test.example.com`;
}

export const TEST_PASSWORD = "BenchTest!2026xQ9";

export function getAuthFlow(toolName: string): AuthFlow {
  switch (toolName) {
    case "clerk":
      // Dynamic import handled at test level, return sync
      throw new Error("Use getAuthFlowAsync for dynamic loading");
    case "propel-auth":
      throw new Error("Use getAuthFlowAsync for dynamic loading");
    default:
      throw new Error(`No auth flow implementation for tool: ${toolName}`);
  }
}

export async function getAuthFlowAsync(toolName: string): Promise<AuthFlow> {
  switch (toolName) {
    case "clerk": {
      const { clerkFlow } = await import("./clerk-flow.js");
      return clerkFlow;
    }
    case "propel-auth": {
      const { propelAuthFlow } = await import("./propel-auth-flow.js");
      return propelAuthFlow;
    }
    default:
      throw new Error(`No auth flow implementation for tool: ${toolName}`);
  }
}
