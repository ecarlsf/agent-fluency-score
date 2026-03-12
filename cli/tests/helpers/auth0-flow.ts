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
    !url.pathname.includes("/api/auth")
  );
}

/** Check if we're on an Auth0 hosted page */
function isHostedAuthPage(url: string): boolean {
  return url.includes("auth0.com");
}

/**
 * Fill and submit an auth form. Works on both Auth0 hosted pages and local pages.
 */
async function fillAndSubmitForm(
  page: Page,
  email: string,
  password: string,
  submitPattern: RegExp,
): Promise<void> {
  // Wait for email input (Auth0 hosted uses input[name="email"] or input[type="email"])
  const emailInput = page
    .getByRole("textbox", { name: /email/i })
    .or(page.locator('input[name="email"], input[type="email"], input[name="username"]'))
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

  // Handle potential second step (password on separate page — Auth0 "identifier first" flow)
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

export const auth0Flow: AuthFlow = {
  signUpPath: "/signup",
  signInPath: "/login",

  async signUp(
    page: Page,
    { email, password }: { email: string; password: string },
  ) {
    await page.goto("/signup");

    // Wait for page to settle — may redirect to Auth0 hosted page
    await page.waitForTimeout(2000);

    if (isHostedAuthPage(page.url())) {
      // On Auth0 Universal Login — switch to sign-up tab if available
      const signUpTab = page
        .locator('a:has-text("Sign up"), a:has-text("Sign Up"), a[href*="signup"]')
        .first();
      if (await signUpTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signUpTab.click();
        await page.waitForTimeout(1000);
      }
      await fillAndSubmitForm(page, email, password, /sign up|continue/i);
    } else {
      // On local page — might have a form or might redirect
      const emailInput = page
        .getByRole("textbox", { name: /email/i })
        .or(page.locator('input[name="email"], input[type="email"]'))
        .first();
      const hasLocalForm = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLocalForm) {
        await fillAndSubmitForm(page, email, password, /sign up|create|register|continue/i);
        await page.waitForTimeout(2000);

        // If redirected to Auth0 hosted page after local submit, fill that too
        if (isHostedAuthPage(page.url())) {
          await fillAndSubmitForm(page, email, password, /sign up|continue/i);
        }
      } else {
        // No local form — page might auto-redirect or have a redirect button
        const signUpBtn = page
          .getByRole("button", { name: /sign up|create account|register/i })
          .first();
        if (await signUpBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await signUpBtn.click();
        }

        await page.waitForTimeout(3000);
        if (isHostedAuthPage(page.url())) {
          const signUpTab = page
            .locator('a:has-text("Sign up"), a:has-text("Sign Up")')
            .first();
          if (await signUpTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await signUpTab.click();
            await page.waitForTimeout(1000);
          }
          await fillAndSubmitForm(page, email, password, /sign up|continue/i);
        }
      }
    }

    // Wait for redirect back to localhost (past all auth pages)
    await page.waitForURL((url) => isAuthenticated(url), { timeout: 30000 });
  },

  async signIn(
    page: Page,
    { email, password }: { email: string; password: string },
  ) {
    await page.goto("/login");

    // Wait for page to settle
    await page.waitForTimeout(2000);

    if (isHostedAuthPage(page.url())) {
      await fillAndSubmitForm(page, email, password, /log in|sign in|continue/i);
    } else {
      const emailInput = page
        .getByRole("textbox", { name: /email/i })
        .or(page.locator('input[name="email"], input[type="email"]'))
        .first();
      const hasLocalForm = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLocalForm) {
        await fillAndSubmitForm(page, email, password, /log in|sign in|login|continue/i);
        await page.waitForTimeout(2000);
        if (isHostedAuthPage(page.url())) {
          await fillAndSubmitForm(page, email, password, /log in|sign in|continue/i);
        }
      } else {
        const loginBtn = page
          .getByRole("button", { name: /log in|sign in|login/i })
          .first();
        if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await loginBtn.click();
        }
        await page.waitForTimeout(3000);
        if (isHostedAuthPage(page.url())) {
          await fillAndSubmitForm(page, email, password, /log in|sign in|continue/i);
        }
      }
    }

    // Wait for redirect back to localhost
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
            'a[href*="logout"], a[href*="signout"]',
        )
        .first();
      await signOutButton.waitFor({ state: "visible", timeout: 10000 });
      await signOutButton.click();
    }

    // Wait for redirect — may go through Auth0's logout endpoint first, then back to localhost
    await page.waitForURL(
      (url) => {
        if (url.hostname === "localhost") {
          return (
            url.pathname === "/" ||
            url.pathname.includes("/login") ||
            url.pathname.includes("/sign-in")
          );
        }
        return false;
      },
      { timeout: 15000 },
    );
  },
};
