import { test, expect } from "@playwright/test";
import { getAuthFlowAsync, generateTestEmail, TEST_PASSWORD } from "../helpers/auth-flow.js";

const toolName = process.env.TOOL_NAME || "clerk";

test.describe("Tier 3 — Integration", () => {
  let authFlow: Awaited<ReturnType<typeof getAuthFlowAsync>>;
  const testEmail = generateTestEmail();

  test.beforeAll(async () => {
    authFlow = await getAuthFlowAsync(toolName);
  });

  test("unauthenticated /dashboard redirects to auth page", async ({ page, context }) => {
    // Clear all cookies to ensure unauthenticated state
    await context.clearCookies();
    await page.goto("/dashboard");
    // Should redirect to sign-in or similar auth page
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    const isRedirected =
      url.includes("/sign-in") ||
      url.includes("/login") ||
      url.includes("/sign-up") ||
      url.includes("/signup") ||
      url.includes("accounts.") ||
      !url.includes("/dashboard");
    expect(isRedirected).toBe(true);
  });

  test("unauthenticated /settings redirects to auth page", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    const isRedirected =
      url.includes("/sign-in") ||
      url.includes("/login") ||
      url.includes("/sign-up") ||
      url.includes("/signup") ||
      url.includes("accounts.") ||
      !url.includes("/settings");
    expect(isRedirected).toBe(true);
  });

  test("home page is publicly accessible (no redirect)", async ({ page, context }) => {
    await context.clearCookies();
    const response = await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    expect(response!.status()).toBeLessThan(400);
    // Should still be on home page, not redirected to auth
    const url = page.url();
    const pathname = new URL(url).pathname;
    expect(pathname === "/" || pathname === "").toBe(true);
  });

  test("sign-in restores access to protected routes", async ({ page }) => {
    // Sign up first so the account exists for sign-in
    await authFlow.signUp(page, { email: testEmail, password: TEST_PASSWORD });
    await page.context().clearCookies();
    await authFlow.signIn(page, { email: testEmail, password: TEST_PASSWORD });
    // Now navigate to dashboard — should NOT redirect
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/dashboard");
  });
});
