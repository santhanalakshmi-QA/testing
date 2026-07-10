// utils/Helper.js
// ─────────────────────────────────────────────────────────────
// Shared helper functions used across all test files.
// Import what you need in any test file like this:
//   import { BREAKPOINTS, collectErrors } from '../utils/helper.js';
//
// Everything here is theme-agnostic. The selector-coupled helpers that used
// to live in this file (addToCart, searchFor, fillContactForm, openMobileMenu,
// sectionsOfType, sectionWrappers) were bound to the Lollipop theme's shared
// selector map and were removed with it. Re-add them per-theme in a page
// object rather than here, so selectors never leak into the utility layer.
// ─────────────────────────────────────────────────────────────
import { expect } from '@playwright/test';

// Trailing slash stripped so `BASE_URL + '/path'` never yields `//path`.
const BASE_URL = (process.env.SHOPIFY_BASE_URL || 'https://wdtsanthanalakshmi.myshopify.com').replace(/\/+$/, '');

// ── URL constants ─────────────────────────────────────────────
export const URLS = {
  home:        '/',
  collections: '/collections/all',
  cart:        '/cart',
  contact:     '/pages/contact',
  blog:        '/blogs/news',
  search:      '/search',
  login:       '/account/login',
  register:    '/account/register',
  notFound:    '/this-page-does-not-exist-404',
};

// ── Breakpoints for responsive testing ───────────────────────
export const BREAKPOINTS = [
  { name: 'Mobile-S',  width: 375,  height: 812  },
  { name: 'Mobile-L',  width: 430,  height: 932  },
  { name: 'Tablet',    width: 768,  height: 1024 },
  { name: 'Desktop-S', width: 1024, height: 768  },
  { name: 'Desktop-L', width: 1440, height: 900  },
  { name: 'Wide',      width: 1920, height: 1080 },
];

// ── Navigate to a path and wait ───────────────────────────────
export async function gotoPage(page, path, waitUntil = 'domcontentloaded') {
  await page.goto(BASE_URL + path, { waitUntil });
}

// ── Collect JS console errors ─────────────────────────────────
// Call BEFORE page.goto() — returns array of errors found
export function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// ── Collect failed network requests ──────────────────────────
// Flags any request returning 400+ status codes
export function collectFailedRequests(page) {
  const failed = [];
  page.on('response', (res) => {
    if (res.status() >= 400) {
      failed.push(`[${res.status()}] ${res.url()}`);
    }
  });
  return failed;
}

// ── Set viewport size ─────────────────────────────────────────
export async function setViewport(page, width, height) {
  await page.setViewportSize({ width, height });
}

// ── Take a screenshot ─────────────────────────────────────────
export async function takeScreenshot(page, fileName) {
  await page.screenshot({
    path: `screenshots/${fileName}.png`,
    fullPage: false,
  });
  console.log(`📸 Screenshot saved: screenshots/${fileName}.png`);
}

// ── Check if element is visible (safe — no error thrown) ──────
export async function isVisible(page, selector) {
  try {
    return await page.locator(selector).first().isVisible();
  } catch {
    return false;
  }
}

// ── Wait for element to appear ────────────────────────────────
export async function waitFor(page, selector, timeout = 8000) {
  await page.locator(selector).first().waitFor({
    state: 'visible',
    timeout,
  });
}

// ── Scroll down the page ──────────────────────────────────────
export async function scrollDown(page, pixels = 600) {
  await page.evaluate((px) => window.scrollBy(0, px), pixels);
  await page.waitForTimeout(300);
}

// ── Get all internal links on current page ────────────────────
export async function getInternalLinks(page) {
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((a) => a.getAttribute('href'))
  );
  return [...new Set(
    hrefs.filter((h) =>
      h && h.startsWith('/') && !h.startsWith('//') && !h.includes('#')
    )
  )];
}
// ── Home-page section helpers ────────────────────────────────
export const VIEWPORTS = {
  mobile:  { width: 375,  height: 812 },
  tablet:  { width: 768,  height: 1024 },
  desktop: { width: 1440, height: 900 },
};

export async function gotoHome(page) {
  await gotoPage(page, URLS.home);
  await page.waitForLoadState('networkidle').catch(() => {});
}

export async function expectAtLeast(locator, min, label) {
  const count = await locator.count();
  expect(count, `Expected ≥${min} "${label}", found ${count}`).toBeGreaterThanOrEqual(min);
  return count;
}

export async function expectImageLoaded(img) {
  await expect(img).toBeVisible();
  const ok = await img.evaluate((el) =>
    el.tagName.toLowerCase() !== 'img' ? true : el.complete && el.naturalWidth > 0
  );
  expect(ok, 'Image should be loaded (naturalWidth > 0)').toBeTruthy();
}
export default {
  URLS,
  BREAKPOINTS,
  VIEWPORTS,
  gotoPage,
  gotoHome,
  collectErrors,
  collectFailedRequests,
  setViewport,
  takeScreenshot,
  isVisible,
  waitFor,
  scrollDown,
  getInternalLinks,
  expectAtLeast,
  expectImageLoaded,
};
