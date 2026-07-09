// Load .env into process.env BEFORE anything below reads it. Playwright also
// loads this config inside each worker, so BasePage/helper.js see the vars too.
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import os from 'node:os';

// Playwright transpiles this config to CommonJS, so `require` is available
// at runtime. Read the installed Playwright version for the Allure
// "Environment" widget without hard-coding it.
let pwVersion = 'unknown';
try {
  pwVersion = require('@playwright/test/package.json').version;
} catch {
  /* version is best-effort only */
}

// Single source of truth for the storefront under test. SHOPIFY_BASE_URL is what
// BasePage.js / utils/helper.js read; STORE_URL is kept as a legacy fallback.
// The trailing slash is stripped so `baseURL + '/path'` never yields `//path`.
const BASE_URL = (process.env.SHOPIFY_BASE_URL ?? process.env.STORE_URL ?? 'https://lollipop-theme.myshopify.com')
  .replace(/\/+$/, '');

// When the storefront is password-protected and/or a specific theme is being
// previewed, globalSetup writes the unlock cookies here and every test context
// reuses them. Keep this path in sync with scripts/allure-global-setup.ts.
const STORAGE_STATE = 'playwright/.auth/storefront.json';
const NEEDS_UNLOCK = Boolean(
  process.env.SHOPIFY_STOREFRONT_PASSWORD?.trim() || process.env.SHOPIFY_PREVIEW_THEME_ID?.trim(),
);

/**
 * Playwright configuration for the Lollipop Shopify theme home page suite.
 * Base URL points at the theme preview store. Projects cover the responsive
 * breakpoints referenced by the responsive test cases (mobile / tablet / desktop).
 */
export default defineConfig({
  testDir: './tests',
  // Clear stale ./allure-results before every run so the generated report
  // reflects ONLY the specs that were just executed (the reporter appends
  // results and never cleans them itself). Trend history is preserved.
  globalSetup: './scripts/allure-global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // The app under test is a live, externally-hosted Shopify preview store,
  // so allow a realistic per-test budget and one local retry to absorb
  // transient network slowness / rate-limiting.
  timeout: 60_000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    // Keep Playwright's own HTML report and the console list output…
    ['html', { open: 'never' }],
    ['list'],
    // …and add Allure. The reporter writes raw results to ./allure-results
    // during the run (even when tests fail), which `npm run allure:generate`
    // turns into the browsable Allure report.
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        // Emit Playwright test.step() calls and command/attachment detail so
        // each Allure test case shows its full step tree.
        detail: true,
        // Use the describe() nesting as the Allure suite hierarchy.
        suiteTitle: true,
        // Shown on the report's "Environment" widget.
        environmentInfo: {
          Project: 'Lollipop Shopify Home Tests',
          Base_URL: BASE_URL,
          Playwright: pwVersion,
          Node: process.version,
          OS: `${os.type()} ${os.release()}`,
          Arch: os.arch(),
          Executor: process.env.CI ? 'CI' : os.hostname(),
          Browser: 'Chromium',
          Devices: 'Desktop Chrome 1440×900 · iPad (gen 7) · iPhone 13',
          CI: process.env.CI ? 'true' : 'false',
        },
        // Project-wide Allure tags applied to every test (surface on the
        // report's "Tags" filter). Per-test tags can still be added via
        // Playwright's `tag` option or `@tag` in a title.
        globalLabels: [
          { name: 'epic', value: 'Lollipop Storefront' },
          { name: 'tag', value: 'storefront' },
          { name: 'tag', value: 'ui' },
        ],
        // Classifies results on the report's "Categories" widget. Allure
        // already splits assertion failures (Failed) from other errors
        // (Broken); these rules give friendlier, grouped buckets.
        categories: [
          {
            name: 'Broken tests',
            matchedStatuses: ['broken'],
          },
          {
            name: 'Product defects (assertion failures)',
            matchedStatuses: ['failed'],
          },
          {
            name: 'Timeouts',
            matchedStatuses: ['broken', 'failed'],
            messageRegex: '.*Timeout.*exceeded.*',
          },
          {
            name: 'Ignored / skipped tests',
            matchedStatuses: ['skipped'],
          },
        ],
      },
    ],
  ],

  use: {
    baseURL: BASE_URL,
    // Reuse the storefront-password / theme-preview cookies planted by
    // globalSetup. Left undefined for open storefronts so nothing changes.
    storageState: NEEDS_UNLOCK ? STORAGE_STATE : undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
