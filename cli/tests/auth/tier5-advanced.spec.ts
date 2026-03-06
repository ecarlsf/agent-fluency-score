import { test, expect } from "@playwright/test";
import { getAuthFlowAsync, generateTestEmail, TEST_PASSWORD } from "../helpers/auth-flow.js";

const toolName = process.env.TOOL_NAME || "clerk";

test.describe("Tier 5 — Advanced", () => {
  let authFlow: Awaited<ReturnType<typeof getAuthFlowAsync>>;
  const testEmail = generateTestEmail();

  test.beforeAll(async () => {
    authFlow = await getAuthFlowAsync(toolName);
  });

  test("organization or team UI exists", async ({ page }) => {
    // Sign up + sign in to access potential org features
    await authFlow.signUp(page, { email: testEmail, password: TEST_PASSWORD });
    await page.context().clearCookies();
    await authFlow.signIn(page, { email: testEmail, password: TEST_PASSWORD });

    // Check multiple potential locations for org/team UI
    // This could be in nav, sidebar, settings, or a dedicated page
    const orgIndicators = [
      // Text content
      'text=/organization/i',
      'text=/team/i',
      'text=/workspace/i',
      // Clerk org components
      '[class*="cl-organizationSwitcher"]',
      '[data-clerk-component="OrganizationSwitcher"]',
      '[class*="cl-organizationProfile"]',
      // Common org-related elements
      'a[href*="org"]',
      'a[href*="team"]',
      'button:has-text("Create organization")',
      'button:has-text("Create team")',
    ];

    let found = false;
    for (const selector of orgIndicators) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          found = true;
          break;
        }
      } catch {
        // Selector not found, try next
      }
    }

    // Also check page content for org-related text
    if (!found) {
      const bodyText = await page.locator("body").textContent();
      const hasOrgText =
        /organization/i.test(bodyText || "") ||
        /team\s+(management|settings|members)/i.test(bodyText || "") ||
        /workspace/i.test(bodyText || "");
      found = hasOrgText;
    }

    // Try navigating to common org-related pages
    if (!found) {
      for (const orgPath of ["/organizations", "/org", "/teams", "/team"]) {
        try {
          const response = await page.goto(orgPath);
          if (response && response.status() < 400) {
            found = true;
            break;
          }
        } catch {
          // Path doesn't exist
        }
      }
    }

    expect(found).toBe(true);
  });
});
