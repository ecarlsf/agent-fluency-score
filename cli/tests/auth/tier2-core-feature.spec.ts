import { test, expect } from "@playwright/test";
import { getAuthFlowAsync } from "../helpers/auth-flow.js";

const toolName = process.env.TOOL_NAME || "clerk";

test.describe("Tier 2 — Core Feature", () => {
  let authFlow: Awaited<ReturnType<typeof getAuthFlowAsync>>;

  test.beforeAll(async () => {
    authFlow = await getAuthFlowAsync(toolName);
  });

  test("Google OAuth button is visible on sign-in page", async ({ page }) => {
    await page.goto(authFlow.signInPath);
    // Wait for auth page content (form fields or auth buttons)
    const authContent = page.locator('input:not([type="hidden"])')
      .or(page.getByRole("textbox"))
      .or(page.getByRole("button", { name: /sign in|log in|continue|login/i }))
      .first();
    await authContent.waitFor({ state: "visible", timeout: 15000 });

    // Look for a Google sign-in button — various possible implementations
    const googleButton = page.locator([
      'button:has-text("Google")',
      'a:has-text("Google")',
      'button:has-text("Continue with Google")',
      'a:has-text("Continue with Google")',
      'button:has-text("Sign in with Google")',
      'a:has-text("Sign in with Google")',
      '[data-provider="google"]',
      '[aria-label*="Google"]',
    ].join(", ")).first();

    await expect(googleButton).toBeVisible({ timeout: 10000 });
  });
});
