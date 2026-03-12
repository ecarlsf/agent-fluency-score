import { Page } from "@playwright/test";
import type { AuthFlow } from "./auth-flow.js";

/** Check if the page is back on localhost and past auth pages */
function isAuthenticated(url: URL): boolean {
  return (
    url.hostname === "localhost" &&
    !url.pathname.includes("/login") &&
    !url.pathname.includes("/signup") &&
    !url.pathname.includes("/sign-in") &&
    !url.pathname.includes("/sign-up") &&
    !url.pathname.includes("/register") &&
    !url.pathname.includes("/api/auth")
  );
}

/**
 * Fill and submit an auth form. Works on both NextAuth's built-in pages
 * and custom auth pages.
 */
async function fillAndSubmitForm(
  page: Page,
  email: string,
  password: string,
  submitPattern: RegExp,
): Promise<void> {
  // Wait for email input
  const emailInput = page
    .getByRole("textbox", { name: /email/i })
    .or(page.locator('input[name="email"], input[type="email"], input[name="username"], input[id="email"]'))
    .first();
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill(email);

  // Fill password if visible on same page
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await passwordInput.fill(password);
  }

  // Click submit
  const submitButton = page
    .getByRole("button", { name: submitPattern })
    .or(page.locator('button[type="submit"]'))
    .first();
  await submitButton.click();

  // Handle potential second step (password on separate page)
  await page.waitForTimeout(1500);
  const passwordStep = page.locator('input[type="password"]').first();
  if (await passwordStep.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passwordStep.fill(password);
    const nextSubmit = page
      .getByRole("button", { name: submitPattern })
      .or(page.locator('button[type="submit"]'))
      .first();
    await nextSubmit.click();
  }
}

export const nextauthFlow: AuthFlow = {
  signUpPath: "/signup",
  signInPath: "/login",

  async signUp(
    page: Page,
    { email, password }: { email: string; password: string },
  ) {
    // Try /signup first, fall back to /register or /sign-up
    await page.goto("/signup");
    await page.waitForTimeout(1500);

    // Check if we got a 404 or redirect — try alternatives
    if (page.url().includes("404") || (await page.locator("text=404").isVisible({ timeout: 1000 }).catch(() => false))) {
      await page.goto("/register");
      await page.waitForTimeout(1500);
    }
    if (page.url().includes("404") || (await page.locator("text=404").isVisible({ timeout: 1000 }).catch(() => false))) {
      await page.goto("/sign-up");
      await page.waitForTimeout(1500);
    }

    // Check if we ended up on a NextAuth built-in page or a custom page
    const emailInput = page
      .getByRole("textbox", { name: /email/i })
      .or(page.locator('input[name="email"], input[type="email"], input[name="username"]'))
      .first();
    const hasForm = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasForm) {
      await fillAndSubmitForm(page, email, password, /sign up|create|register|continue|submit/i);
    } else {
      // Maybe there's a "Sign up" link on a sign-in page
      const signUpLink = page
        .locator('a:has-text("Sign up"), a:has-text("Register"), a:has-text("Create account")')
        .first();
      if (await signUpLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signUpLink.click();
        await page.waitForTimeout(1500);
        await fillAndSubmitForm(page, email, password, /sign up|create|register|continue|submit/i);
      }
    }

    // Wait for redirect to authenticated page
    await page.waitForURL((url) => isAuthenticated(url), { timeout: 30000 });
  },

  async signIn(
    page: Page,
    { email, password }: { email: string; password: string },
  ) {
    // Try /login first, fall back to /sign-in or /api/auth/signin
    await page.goto("/login");
    await page.waitForTimeout(1500);

    if (page.url().includes("404") || (await page.locator("text=404").isVisible({ timeout: 1000 }).catch(() => false))) {
      await page.goto("/sign-in");
      await page.waitForTimeout(1500);
    }
    if (page.url().includes("404") || (await page.locator("text=404").isVisible({ timeout: 1000 }).catch(() => false))) {
      await page.goto("/api/auth/signin");
      await page.waitForTimeout(1500);
    }

    const emailInput = page
      .getByRole("textbox", { name: /email/i })
      .or(page.locator('input[name="email"], input[type="email"], input[name="username"]'))
      .first();
    const hasForm = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasForm) {
      await fillAndSubmitForm(page, email, password, /sign in|log in|login|continue|submit/i);
    }

    // Wait for redirect to authenticated page
    await page.waitForURL((url) => isAuthenticated(url), { timeout: 30000 });
  },

  async signOut(page: Page) {
    // Look for user menu first, then direct sign-out button
    const userButton = page
      .getByRole("button", { name: /user menu|account|open menu/i })
      .or(page.locator('[class*="avatar"], [class*="user-button"]'))
      .first();

    if (await userButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await userButton.click();
      const signOutOption = page
        .getByRole("menuitem", { name: /sign out|log out|logout/i })
        .or(
          page.locator(
            'button:has-text("Sign out"), button:has-text("Log out"), button:has-text("Log Out"), ' +
              'a:has-text("Sign out"), a:has-text("Log out"), a:has-text("Log Out")',
          ),
        )
        .first();
      await signOutOption.waitFor({ state: "visible", timeout: 5000 });
      await signOutOption.click();
    } else {
      // Fallback: direct sign-out button/link
      const signOutButton = page
        .locator(
          'button:has-text("Sign out"), button:has-text("Log out"), button:has-text("Log Out"), button:has-text("Logout"), ' +
            'a:has-text("Sign out"), a:has-text("Log out"), a:has-text("Log Out"), a:has-text("Logout"), ' +
            'a[href*="logout"], a[href*="signout"], a[href*="api/auth/signout"]',
        )
        .first();
      await signOutButton.waitFor({ state: "visible", timeout: 10000 });
      await signOutButton.click();
    }

    // Wait for redirect to home or login page
    await page.waitForURL(
      (url) => {
        if (url.hostname === "localhost") {
          return (
            url.pathname === "/" ||
            url.pathname.includes("/login") ||
            url.pathname.includes("/sign-in") ||
            url.pathname.includes("/api/auth/signin")
          );
        }
        return false;
      },
      { timeout: 15000 },
    );
  },
};
