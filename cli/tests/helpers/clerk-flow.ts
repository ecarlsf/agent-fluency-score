import { Page, expect } from "@playwright/test";
import type { AuthFlow } from "./auth-flow.js";

export const clerkFlow: AuthFlow = {
  signUpPath: "/sign-up",
  signInPath: "/sign-in",

  async signUp(page: Page, { email, password }: { email: string; password: string }) {
    await page.goto("/sign-up");

    // Wait for Clerk's sign-up form to render
    await page.waitForSelector('input[name="emailAddress"], input[name="email_address"], input[id*="email"]', { timeout: 15000 });

    // Fill email
    const emailInput = page.locator('input[name="emailAddress"], input[name="email_address"], input[id*="email"]').first();
    await emailInput.fill(email);

    // Fill password if visible on same page
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill(password);
    }

    // Click Continue
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Wait for URL to change (either verify page or direct to dashboard)
    await page.waitForURL((url) => url.pathname !== "/sign-up", { timeout: 10000 });

    // Handle password step if Clerk uses a two-step flow
    if (page.url().includes("/sign-up") && !page.url().includes("verify")) {
      const passwordStep = page.locator('input[name="password"], input[type="password"]').first();
      if (await passwordStep.isVisible({ timeout: 3000 }).catch(() => false)) {
        await passwordStep.fill(password);
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await page.waitForURL((url) => !url.pathname.endsWith("/sign-up"), { timeout: 10000 });
      }
    }

    // Wait for navigation away from sign-up (authenticated state)
    await page.waitForURL((url) => !url.pathname.includes("/sign-up") && !url.pathname.includes("/sign-in"), {
      timeout: 15000,
    });
  },

  async signIn(page: Page, { email, password }: { email: string; password: string }) {
    // Navigate to sign-in; retry once on ERR_ABORTED (caused by redirect conflicts after sign-up)
    try {
      await page.goto("/sign-in");
    } catch {
      await page.waitForTimeout(500);
      await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    }

    // Wait for Clerk's sign-in form
    await page.waitForSelector('input[name="identifier"], input[name="email"], input[id*="email"], input[id*="identifier"]', { timeout: 15000 });

    // Clerk sign-in is typically two-step: identifier first, then password
    const identifierInput = page.locator('input[name="identifier"], input[name="email"], input[id*="email"], input[id*="identifier"]').first();
    await identifierInput.fill(email);

    // Click continue (getByRole ignores aria-hidden elements, exact avoids "Continue with Google")
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Wait for password step
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });
    await passwordInput.fill(password);

    // Submit
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Wait for navigation away from sign-in
    await page.waitForURL((url) => !url.pathname.includes("/sign-in") && !url.pathname.includes("/sign-up"), {
      timeout: 15000,
    });
  },

  async signOut(page: Page) {
    // Wait for user menu button to render (Clerk's UserButton loads asynchronously)
    const userButton = page.getByRole("button", { name: /user menu/i })
      .or(page.locator('[class*="cl-userButton"], [class*="cl-avatar"], [data-clerk-component="UserButton"]'))
      .first();
    await userButton.waitFor({ state: "visible", timeout: 15000 });
    await userButton.click();

    // Wait for dropdown menu and click sign out
    const signOutOption = page.getByRole("menuitem", { name: /sign out/i })
      .or(page.locator('button:has-text("Sign out"), a:has-text("Sign out"), [class*="cl-signOut"]'))
      .first();
    await signOutOption.waitFor({ state: "visible", timeout: 5000 });
    await signOutOption.click();

    // Wait for redirect to sign-in or home
    await page.waitForURL((url) => url.pathname.includes("/sign-in") || url.pathname === "/", {
      timeout: 15000,
    });
  },
};
