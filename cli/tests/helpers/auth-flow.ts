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
  return `benchmark${Date.now()}@test.example.com`;
}

export const TEST_PASSWORD = "BenchTest!2026xQ9";

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
    case "auth0": {
      const { auth0Flow } = await import("./auth0-flow.js");
      return auth0Flow;
    }
    case "nextauth": {
      const { nextauthFlow } = await import("./nextauth-flow.js");
      return nextauthFlow;
    }
    default:
      throw new Error(`No auth flow implementation for tool: ${toolName}`);
  }
}
