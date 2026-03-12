import { test, expect } from "@playwright/test";
import { getAuthFlowAsync, generateTestEmail, TEST_PASSWORD } from "../helpers/auth-flow.js";

const toolName = process.env.TOOL_NAME || "clerk";

test.describe("Tier 4 — Production", () => {
  let authFlow: Awaited<ReturnType<typeof getAuthFlowAsync>>;
  const testEmail = generateTestEmail();

  test.beforeAll(async () => {
    authFlow = await getAuthFlowAsync(toolName);
  });

  test("sign-out button exists after sign-in", async ({ page }) => {
    // Sign up first so the account exists for sign-in
    await authFlow.signUp(page, { email: testEmail, password: TEST_PASSWORD });
    await page.context().clearCookies();
    await authFlow.signIn(page, { email: testEmail, password: TEST_PASSWORD });

    // Look for sign-out / logout button anywhere on page
    const signOutElement = page.locator([
      'button:has-text("Sign out")',
      'button:has-text("Log out")',
      'button:has-text("Logout")',
      'a:has-text("Sign out")',
      'a:has-text("Log out")',
      'a:has-text("Logout")',
      '[class*="cl-userButton"]',
      '[data-clerk-component="UserButton"]',
      '[class*="cl-avatar"]',
    ].join(", ")).first();

    await expect(signOutElement).toBeVisible({ timeout: 10000 });
  });

  test("sign-out clears session and redirects", async ({ page }) => {
    // Account already created by previous test — just sign in
    await authFlow.signIn(page, { email: testEmail, password: TEST_PASSWORD });
    await authFlow.signOut(page);

    // After sign-out, attempting to access /dashboard should redirect
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    const isRedirected =
      url.includes("/sign-in") ||
      url.includes("/login") ||
      url.includes("/sign-up") ||
      url.includes("/signup") ||
      !url.includes("/dashboard");
    expect(isRedirected).toBe(true);
  });
});
