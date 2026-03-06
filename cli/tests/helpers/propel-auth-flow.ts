import { Page } from "@playwright/test";
import type { AuthFlow } from "./auth-flow.js";

/** Check if the page is back on localhost and past auth pages */
function isAuthenticated(url: URL): boolean {
  return url.hostname === "localhost" &&
    !url.pathname.includes("/signup") &&
    !url.pathname.includes("/login") &&
    !url.pathname.includes("/sign-up") &&
    !url.pathname.includes("/sign-in") &&
    !url.pathname.includes("/api/auth");
}

/** Check if we're on a PropelAuth hosted page */
function isHostedAuthPage(url: string): boolean {
  return url.includes("propelauthtest.com") || url.includes("propelauth.com");
}

/**
 * Fill and submit an auth form. Waits for email input to appear,
 * fills email + password, and clicks submit.
 */
async function fillAndSubmitForm(
  page: Page,
  email: string,
  password: string,
  submitPattern: RegExp,
): Promise<void> {
  // Wait for email input using role-based selector (works on any page)
  const emailInput = page.getByRole("textbox", { name: /email/i }).first();
  await emailInput.waitFor({ state: "visible", timeout: 15000 });
  await emailInput.fill(email);

  // Fill password
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await passwordInput.fill(password);
  }

  // Click submit
  const submitButton = page.getByRole("button", { name: submitPattern })
    .or(page.locator('button[type="submit"]'))
    .first();
  await submitButton.click();

  // Handle potential second step (password on separate page)
  await page.waitForTimeout(1000);
  const passwordStep = page.locator('input[type="password"]').first();
  if (await passwordStep.isVisible({ timeout: 2000 }).catch(() => false)) {
    await passwordStep.fill(password);
    const nextSubmit = page.getByRole("button", { name: submitPattern })
      .or(page.locator('button[type="submit"]'))
      .first();
    await nextSubmit.click();
  }
}

export const propelAuthFlow: AuthFlow = {
  signUpPath: "/signup",
  signInPath: "/login",

  async signUp(page: Page, { email, password }: { email: string; password: string }) {
    await page.goto("/signup");

    // Wait for page to settle — may redirect to PropelAuth hosted page
    await page.waitForTimeout(2000);

    // Check if we're on the hosted page or still on localhost
    if (isHostedAuthPage(page.url())) {
      // On PropelAuth hosted signup page — fill the form there
      await fillAndSubmitForm(page, email, password, /sign up/i);
    } else {
      // On local page — might have a form or might redirect
      const emailInput = page.getByRole("textbox", { name: /email/i }).first();
      const hasLocalForm = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLocalForm) {
        // Local form exists — fill and submit
        await fillAndSubmitForm(page, email, password, /sign up|create|register/i);

        // Wait for navigation after local form submit
        await page.waitForTimeout(2000);

        // If redirected to hosted page, fill that form too
        if (isHostedAuthPage(page.url())) {
          await fillAndSubmitForm(page, email, password, /sign up/i);
        }
      } else {
        // No local form — page might auto-redirect or have a redirect button
        // Click any sign-up button if present
        const signUpBtn = page.getByRole("button", { name: /sign up|create account|register/i }).first();
        if (await signUpBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await signUpBtn.click();
        }

        // Wait for hosted page and fill the form there
        await page.waitForTimeout(3000);
        if (isHostedAuthPage(page.url())) {
          await fillAndSubmitForm(page, email, password, /sign up/i);
        }
      }
    }

    // Wait for redirect back to localhost (past all auth pages)
    await page.waitForURL(
      (url) => isAuthenticated(url),
      { timeout: 30000 },
    );
  },

  async signIn(page: Page, { email, password }: { email: string; password: string }) {
    await page.goto("/login");

    // Wait for page to settle
    await page.waitForTimeout(2000);

    if (isHostedAuthPage(page.url())) {
      await fillAndSubmitForm(page, email, password, /log in|sign in/i);
    } else {
      const emailInput = page.getByRole("textbox", { name: /email/i }).first();
      const hasLocalForm = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLocalForm) {
        await fillAndSubmitForm(page, email, password, /log in|sign in|login/i);
        await page.waitForTimeout(2000);
        if (isHostedAuthPage(page.url())) {
          await fillAndSubmitForm(page, email, password, /log in|sign in/i);
        }
      } else {
        const loginBtn = page.getByRole("button", { name: /log in|sign in|login/i }).first();
        if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await loginBtn.click();
        }
        await page.waitForTimeout(3000);
        if (isHostedAuthPage(page.url())) {
          await fillAndSubmitForm(page, email, password, /log in|sign in/i);
        }
      }
    }

    // Wait for redirect back to localhost
    await page.waitForURL(
      (url) => isAuthenticated(url),
      { timeout: 30000 },
    );
  },

  async signOut(page: Page) {
    // Wait for user menu or sign-out button to render
    const userButton = page.getByRole("button", { name: /user menu|account|open menu/i })
      .or(page.locator('[class*="avatar"], [class*="user-button"]'))
      .first();

    if (await userButton.isVisible({ timeout: 10000 }).catch(() => false)) {
      await userButton.click();
      const signOutOption = page.getByRole("menuitem", { name: /sign out|log out|logout/i })
        .or(page.locator('button:has-text("Sign out"), button:has-text("Log out"), a:has-text("Sign out"), a:has-text("Log out")'))
        .first();
      await signOutOption.waitFor({ state: "visible", timeout: 5000 });
      await signOutOption.click();
    } else {
      // Fallback: direct sign-out button/link
      const signOutButton = page.locator(
        'button:has-text("Sign out"), button:has-text("Log out"), button:has-text("Logout"), ' +
        'a:has-text("Sign out"), a:has-text("Log out"), a:has-text("Logout"), ' +
        'a[href*="logout"], a[href*="signout"]'
      ).first();
      await signOutButton.waitFor({ state: "visible", timeout: 10000 });
      await signOutButton.click();
    }

    // Wait for redirect — might go to PropelAuth hosted page first, then back to localhost
    await page.waitForURL(
      (url) => {
        if (url.hostname === "localhost") {
          return url.pathname.includes("/login") || url.pathname.includes("/sign-in") || url.pathname === "/";
        }
        return false;
      },
      { timeout: 15000 },
    );
  },
};
