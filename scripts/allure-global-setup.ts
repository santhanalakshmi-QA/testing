// scripts/allure-global-setup.ts
// ─────────────────────────────────────────────────────────────
// Playwright globalSetup — runs ONCE before every `playwright test`
// invocation (however it is launched). Playwright allows only ONE
// globalSetup, so both startup concerns live here:
//
//   1. Clear stale ./allure-results. The allure reporter APPENDS results and
//      never cleans them; `allure generate --clean` only wipes the generated
//      *report*. Without this, running one spec would still report every spec
//      ever run. `history` is preserved so trends survive.
//
//   2. Unlock the storefront. Password-protected stores (every Shopify
//      Development plan) gate the storefront behind /password. We log in ONCE
//      through the real password form and persist the resulting session
//      cookies to a storageState file that every test context reuses.
//
//      NOTE: the old `storefront_digest = md5(password)` cookie trick is
//      obsolete — Shopify no longer sets or honours that cookie on these
//      stores (verified against the live store: the form login succeeds and
//      only `_shopify_essential` is set). Hence the real form login below.
//
//      The password is read from the environment and typed into the form in
//      this setup step only. globalSetup runs OUTSIDE the test fixtures, so no
//      trace, video, or screenshot is being recorded — the secret cannot leak
//      into artifacts. It is never logged.
//
//      Optionally plants Shopify's `?preview_theme_id=` cookie so an
//      UNPUBLISHED/DEMO theme renders without publishing it.
//
// Step 2 is a no-op unless SHOPIFY_STOREFRONT_PASSWORD or
// SHOPIFY_PREVIEW_THEME_ID is set.
// ─────────────────────────────────────────────────────────────
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const RESULTS_DIR = 'allure-results';
// Keep in sync with `storageState` in playwright.config.ts.
const STORAGE_STATE = 'playwright/.auth/storefront.json';

function cleanAllureResults(): void {
  if (!existsSync(RESULTS_DIR)) return;

  let removed = 0;
  for (const entry of readdirSync(RESULTS_DIR)) {
    if (entry === 'history') continue; // keep trend history
    rmSync(path.join(RESULTS_DIR, entry), { recursive: true, force: true });
    removed += 1;
  }
  if (removed > 0) {
    console.log(`[allure] cleared ${removed} stale entr${removed === 1 ? 'y' : 'ies'} from ./${RESULTS_DIR} (kept history)`);
  }
}

const isGated = (url: string): boolean => new URL(url).pathname.startsWith('/password');

async function unlockStorefront(baseURL: string): Promise<void> {
  const password = process.env.SHOPIFY_STOREFRONT_PASSWORD?.trim();
  const themeId = process.env.SHOPIFY_PREVIEW_THEME_ID?.trim();
  if (!password && !themeId) return; // nothing to unlock

  const { hostname } = new URL(baseURL);
  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });

    if (isGated(page.url())) {
      if (!password) {
        throw new Error(
          `[storefront] ${hostname} is password-protected but SHOPIFY_STOREFRONT_PASSWORD is not set in .env.`,
        );
      }

      await page.fill('input#password[name="password"]', password);
      await page.locator('form[action="/password"] button[type="submit"]').first().click();
      await page.waitForURL((u) => !u.pathname.startsWith('/password'), { timeout: 20_000 }).catch(() => {});

      // Re-check from a clean navigation: the form posts via AJAX/redirect.
      await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
      if (isGated(page.url())) {
        throw new Error(
          `[storefront] Wrong password for ${hostname} — still gated at /password. ` +
            'Update SHOPIFY_STOREFRONT_PASSWORD in .env (Admin → Online Store → Preferences → Password protection).',
        );
      }
      console.log(`[storefront] authenticated ${hostname}`);
    }

    if (themeId) {
      // Plants Shopify's theme-preview cookie for the whole session.
      await page.goto(`${baseURL}/?preview_theme_id=${themeId}`, { waitUntil: 'domcontentloaded' });
      console.log(`[storefront] previewing theme ${themeId}`);
    }

    mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
    await context.storageState({ path: STORAGE_STATE });
    console.log(`[storefront] session saved → ${STORAGE_STATE}`);
  } finally {
    await browser.close();
  }
}

export default async function globalSetup(): Promise<void> {
  cleanAllureResults();

  const baseURL = (process.env.SHOPIFY_BASE_URL ?? process.env.STORE_URL ?? 'https://wdtsanthanalakshmi.myshopify.com')
    .replace(/\/+$/, '');
  await unlockStorefront(baseURL);
}
