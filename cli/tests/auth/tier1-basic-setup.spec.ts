import { test, expect } from "@playwright/test";
import { getAuthFlowAsync, generateTestEmail, TEST_PASSWORD } from "../helpers/auth-flow.js";

const toolName = process.env.TOOL_NAME || "clerk";

test.describe("Tier 1 — Basic Setup", () => {
  let authFlow: Awaited<ReturnType<typeof getAuthFlowAsync>>;
  const testEmail = generateTestEmail();

  test.beforeAll(async () => {
    authFlow = await getAuthFlowAsync(toolName);
  });

  test("home page renders without error", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    // Page should have some visible content
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("sign-up page exists and renders", async ({ page }) => {
    const response = await page.goto(authFlow.signUpPath);
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    // Should have auth-related content: form fields, textboxes, or auth buttons
    // Handles both embedded forms and hosted auth redirects
    const authContent = page.locator('input:not([type="hidden"])')
      .or(page.getByRole("textbox"))
      .or(page.getByRole("button", { name: /sign up|create account|continue|register/i }))
      .first();
    await authContent.waitFor({ state: "visible", timeout: 15000 });
  });

  test("sign-in page exists and renders", async ({ page }) => {
    const response = await page.goto(authFlow.signInPath);
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    // Should have auth-related content
    const authContent = page.locator('input:not([type="hidden"])')
      .or(page.getByRole("textbox"))
      .or(page.getByRole("button", { name: /sign in|log in|continue|login/i }))
      .first();
    await authContent.waitFor({ state: "visible", timeout: 15000 });
  });

  test("full sign-up flow completes successfully", async ({ page }) => {
    await authFlow.signUp(page, { email: testEmail, password: TEST_PASSWORD });
    // After sign-up, should NOT be on sign-up or sign-in page
    expect(page.url()).not.toContain("/sign-up");
    expect(page.url()).not.toContain("/sign-in");
    expect(page.url()).not.toContain("/signup");
    expect(page.url()).not.toContain("/login");
  });
});
