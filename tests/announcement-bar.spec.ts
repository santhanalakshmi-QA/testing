// tests/announcement-bar.spec.ts
// ─────────────────────────────────────────────────────────────
// Announcement Bar test suite for the CURRENT published Shopify theme
// "theme-export-wdt-atles-myshopify-com-kajalsele" (a Selena / SHThemes
// build) on wdtsanthanalakshmi.myshopify.com.
//
// Coverage was derived by inspecting the theme source through the Shopify
// MCP server AND dumping the live rendered storefront DOM/CSS. Verified:
//   • The section lives in `header-group`, so it renders above the
//     <site-header> on every template and survives navigation. Dynamic id
//     (#shopify-section-sections--…__announcement_bar) → never hard-coded;
//     scoped via `.announcement-bar` / `.shopify-section--announcement-bar`.
//   • Marquee mode (`data-type="marquee"`): `.announcement-bar__marquee-track`
//       animation: announcement-bar-marquee 30s linear infinite normal;
//     pauses on hover, gated by `[data-pause-hover="true"]`.
//   • Exactly ONE `.announcement-bar__marquee-group` holding 3
//     `.announcement-bar-item` blocks. Item 2 carries a link to
//     /collections/all; the other two are plain text.
//   • Carousel (Swiper) mode, social icons, localization slot, edge fade and
//     any dismiss control are all absent in this config.
//
// Architecture: intent lives in pages/AnnouncementBarPage.ts (extends
// BasePage); selectors live in locators/announcement-bar.locators.ts;
// shared utilities come from utils/helper.js; expected values come from
// data/testData.json. No locators are written inline here.
//
// NOTES / theme defects / non-automatable items are at the bottom of the file.
// ─────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AnnouncementBarPage } from '../pages/AnnouncementBarPage';
import { BREAKPOINTS, collectErrors } from '../utils/helper.js';
import testData from '../data/testData.json';

const AB = testData.announcementBar;

// ═════════════════════════════════════════════════════════════
// 1. STRUCTURE & PRESENCE
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - Structure & Presence', () => {
  let ab: AnnouncementBarPage;

  test.beforeEach(async ({ page }) => {
    ab = new AnnouncementBarPage(page);
    await ab.setDesktopView();
    await ab.open();
  });

  test('announcement bar renders and is visible on load (no scroll needed)', async () => {
    await expect(ab.section).toBeVisible();
  });

  test('announcement bar is wrapped in its own Shopify section', async () => {
    await expect(ab.sectionWrapper).toBeVisible();
    await expect(ab.inner).toBeVisible();
    await expect(ab.content).toBeVisible();
  });

  test('announcement bar is positioned above the site header', async () => {
    const barBox = await ab.section.boundingBox();
    const headerBox = await ab.siteHeader.boundingBox();
    expect(barBox, 'announcement bar should have a layout box').not.toBeNull();
    expect(headerBox, 'site header should have a layout box').not.toBeNull();
    // The bar's top edge must sit above the header's top edge.
    expect(barBox!.y).toBeLessThan(headerBox!.y);
  });

  test('announcement bar applies the configured theme color scheme', async () => {
    await expect(ab.section).toHaveClass(new RegExp(AB.colorSchemeClass));
  });

  test('announcement bar renders the configured bottom divider', async () => {
    // `show_bottom_divider: true` in the section settings adds this modifier.
    expect(AB.showsBottomDivider).toBe(true);
    await expect(ab.section).toHaveClass(/announcement-bar--divider/);
  });
});

// ═════════════════════════════════════════════════════════════
// 2. CONTENT & VALIDATION
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - Content & Validation', () => {
  let ab: AnnouncementBarPage;

  test.beforeEach(async ({ page }) => {
    ab = new AnnouncementBarPage(page);
    await ab.setDesktopView();
    await ab.open();
  });

  test('bar renders at least one announcement item', async () => {
    expect(await ab.items.count()).toBeGreaterThan(0);
    await expect(ab.items.first()).toBeVisible();
  });

  test('bar renders the expected number of announcement items', async () => {
    await expect(ab.items).toHaveCount(AB.itemCount);
  });

  test('every announcement item exposes non-empty text', async () => {
    const texts = await ab.messages();
    expect(texts.length).toBeGreaterThan(0);
    for (const [i, t] of texts.entries()) {
      expect(t, `item #${i} should not be empty`).not.toEqual('');
    }
  });

  test('announcement item content matches the configured text, in order', async () => {
    // messages() reads textContent, so the CSS `text-transform: uppercase`
    // does not leak in — these are the strings authored in theme settings.
    expect(await ab.messages()).toEqual(AB.messages);
  });

  test('the linked announcement item points at its configured destination', async () => {
    await expect(ab.itemLinks).toHaveCount(AB.linkCount);
    expect(await ab.linkHrefs()).toEqual([AB.linkHref]);
    await expect(ab.itemLinks.first()).toHaveText(AB.linkedMessage);
  });

  test('the linked announcement item navigates when clicked', async ({ page }) => {
    // clickLinkedItem() hovers first: the marquee animates continuously, so the
    // anchor is never "stable" for Playwright's actionability check until the
    // theme's pause-on-hover kicks in. See NOTE 7.
    await ab.clickLinkedItem();
    await page.waitForURL(new RegExp(`${AB.linkHref}$`));
    expect(new URL(page.url()).pathname).toBe(AB.linkHref);
  });

  test('unlinked announcement items are plain text, not anchors', async () => {
    // Only one of the three items was given a link in theme settings.
    expect(await ab.items.count()).toBe(AB.itemCount);
    expect(await ab.itemLinks.count()).toBe(AB.linkCount);
  });
});

// ═════════════════════════════════════════════════════════════
// ⚠ DEMO — INTENTIONALLY FAILING TEST (remove after the demo)
// ─────────────────────────────────────────────────────────────
// This block exists ONLY to demonstrate a failing test in the report.
// It is deliberately self-contained and store-independent so it fails
// deterministically on every run, everywhere. The expected count is
// AB.itemCount (3); the assertion asks for one more on purpose.
// To restore a fully-green suite, delete this entire describe block.
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - DEMO (intentional failure)', () => {
  test('DEMO: announcement item count is deliberately wrong (expected to fail)', async ({ page }) => {
    const ab = new AnnouncementBarPage(page);
    await ab.setDesktopView();
    await ab.open();

    // The bar renders AB.itemCount (3) items; asserting itemCount + 1 forces
    // a clear, readable failure: "expected 4, received 3".
    await expect(ab.items).toHaveCount(AB.itemCount + 1);
  });
});

// ═════════════════════════════════════════════════════════════
// 3. MARQUEE BEHAVIOUR  (functional)
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - Marquee behaviour', () => {
  let ab: AnnouncementBarPage;

  test.beforeEach(async ({ page }) => {
    ab = new AnnouncementBarPage(page);
    await ab.setDesktopView();
    await ab.open();
  });

  test('the section renders in marquee mode, not carousel mode', async () => {
    expect(await ab.displayType()).toBe(AB.displayType);
    await expect(ab.marquee).toBeVisible();
    await expect(ab.swiper).toHaveCount(0);
    await expect(ab.swiperSlides).toHaveCount(0);
    await expect(ab.navButtons).toHaveCount(0);
  });

  test('marquee track uses the theme CSS marquee animation', async () => {
    expect(await ab.animationName()).toContain(AB.animationName);
  });

  test('marquee animation loops infinitely', async () => {
    expect(await ab.animationIterationCount()).toBe('infinite');
  });

  test('marquee animation runs at the configured speed and direction', async () => {
    // `speed: 30` → --announce-marquee-speed: 30s; `direction: left` → normal.
    expect(await ab.animationDuration()).toBe(AB.animationDuration);
    expect(await ab.animationDirection()).toBe(AB.animationDirection);
  });

  test('marquee is running by default', async () => {
    expect(await ab.animationPlayState()).toBe('running');
  });

  test('marquee content is clipped by its viewport, not scrollable', async () => {
    expect(await ab.marqueeOverflow()).toBe('hidden');
  });

  test('the theme renders a single marquee group (see NOTE 1 — theme defect)', async () => {
    // Liquid emits ONE group. assets/marquee.js is supposed to clone it so the
    // keyframes' translateX(-50%) yields a seamless loop, but the script never
    // matches this section's class names, so no clones are ever appended.
    // Asserting the real count pins the current behaviour; if the theme is
    // fixed, this test fails loudly and testData.marqueeGroupCount is updated.
    await expect(ab.groups).toHaveCount(AB.marqueeGroupCount);
  });

  test("the theme's marquee.js finds no hooks inside the announcement bar (NOTE 1)", async () => {
    // marquee.js queries .marquee-content / .marquee-track / .marquee-group;
    // this section emits .announcement-bar__marquee{,-track,-group}.
    await expect(ab.jsMarqueeHooks).toHaveCount(0);
  });
});

// ═════════════════════════════════════════════════════════════
// 4. HOVER INTERACTION  (functional / UI — hover-capable pointers only)
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - Hover interaction', () => {
  let ab: AnnouncementBarPage;

  test.beforeEach(async ({ page }) => {
    ab = new AnnouncementBarPage(page);
    await ab.setDesktopView();
    await ab.open();
  });

  test('pause-on-hover is enabled in the theme settings', async () => {
    expect(await ab.pauseOnHoverEnabled()).toBe(AB.pauseOnHover);
  });

  test('hovering the marquee pauses the animation and leaving resumes it', async () => {
    test.skip(!(await ab.supportsHover()), 'pointer has no hover (touch device)');

    expect(await ab.animationPlayState()).toBe('running');

    await ab.hoverMarquee();
    await expect
      .poll(() => ab.animationPlayState(), { message: 'hover should pause the marquee' })
      .toBe('paused');

    await ab.unhoverMarquee();
    await expect
      .poll(() => ab.animationPlayState(), { message: 'leaving should resume the marquee' })
      .toBe('running');
  });
});

// ═════════════════════════════════════════════════════════════
// 5. UI / LAYOUT
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - UI & Layout', () => {
  let ab: AnnouncementBarPage;

  test.beforeEach(async ({ page }) => {
    ab = new AnnouncementBarPage(page);
    await ab.setDesktopView();
    await ab.open();
  });

  test('announcement text does not wrap (single-line ticker)', async () => {
    expect(await ab.itemWhiteSpace()).toBe('nowrap');
  });

  test('announcement text renders in the configured letter case', async () => {
    // `text_transform: uppercase` on every announcement-item block.
    expect(await ab.itemTextTransform()).toBe(AB.textTransform);
  });

  test('the announcement bar spans the full viewport width without overflowing', async ({ page }) => {
    const box = await ab.section.boundingBox();
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(box).not.toBeNull();
    // `width_type: full_width` — allow 1px sub-pixel rounding tolerance.
    expect(box!.width).toBeLessThanOrEqual(innerWidth + 1);
    expect(box!.width).toBeGreaterThanOrEqual(innerWidth - 1);
  });

  test('optional slots disabled in theme settings are not rendered', async () => {
    expect(AB.showsSocialIcons).toBe(false);
    expect(AB.showsLocalization).toBe(false);
    expect(AB.enableEdgeFade).toBe(false);
    await expect(ab.social).toHaveCount(0);
    await expect(ab.localization).toHaveCount(0);
    await expect(ab.edgeFade).toHaveCount(0);
  });
});

// ═════════════════════════════════════════════════════════════
// 6. RESPONSIVE  (integrity across breakpoints)
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - Responsive', () => {
  for (const bp of BREAKPOINTS) {
    test(`bar stays visible above the header and animates at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      const ab = new AnnouncementBarPage(page);
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await ab.open();

      // `hide_on_mobile: false` — the bar is shown at every width.
      expect(AB.hideOnMobile).toBe(false);
      await expect(ab.section).toBeVisible();
      await expect(ab.items).toHaveCount(AB.itemCount);

      const barBox = await ab.section.boundingBox();
      const headerBox = await ab.siteHeader.boundingBox();
      expect(barBox!.y).toBeLessThan(headerBox!.y);

      // The marquee animation is offered at every width.
      expect(await ab.animationName()).toContain(AB.animationName);
    });
  }
});

// ═════════════════════════════════════════════════════════════
// 7. ACCESSIBILITY
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - Accessibility', () => {
  let ab: AnnouncementBarPage;

  test.beforeEach(async ({ page }) => {
    ab = new AnnouncementBarPage(page);
    await ab.setDesktopView();
    await ab.open();
  });

  test('announcement bar has no critical or serious axe violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('.announcement-bar')
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(
      blocking,
      `Critical/serious a11y violations:\n${blocking
        .map((v) => `• ${v.id}: ${v.help}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  test('the linked announcement item is reachable as a link', async () => {
    await expect(ab.itemLinks.first()).toHaveAttribute('href', AB.linkHref);
  });

  test('announcement text remains perceivable when reduced motion is preferred', async ({ page }) => {
    // The bar is a decorative auto-scroller; under reduced-motion the message
    // text must still be present and readable. (See NOTE 2 — the theme does
    // NOT stop the animation itself under reduced motion.)
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ab.open();
    await expect(ab.items.first()).toBeVisible();
    expect(await ab.messages()).toEqual(AB.messages);
  });
});

// ═════════════════════════════════════════════════════════════
// 8. EDGE CASES / NEGATIVE
// ═════════════════════════════════════════════════════════════
test.describe('Announcement Bar - Edge cases', () => {
  let ab: AnnouncementBarPage;

  test.beforeEach(async ({ page }) => {
    ab = new AnnouncementBarPage(page);
    await ab.setDesktopView();
    await ab.open();
  });

  test('the bar is persistent — it exposes no dismiss/close control', async () => {
    await expect(ab.closeButton).toHaveCount(0);
  });

  test('exactly one announcement bar is rendered per page', async () => {
    // The theme also ships a standalone `marquee` section; it must not be
    // mistaken for, or duplicate, the announcement bar.
    await expect(ab.allSections).toHaveCount(1);
  });

  test('the announcement bar persists across navigation (header-group section)', async () => {
    for (const path of ['/collections/all', '/cart']) {
      await ab.open(path);
      await expect(ab.section).toBeVisible();
      expect(await ab.messages()).toEqual(AB.messages);
    }
  });
});

// ═════════════════════════════════════════════════════════════
// 9. STABILITY
// ═════════════════════════════════════════════════════════════

// Known-benign console noise emitted by Shopify/theme infrastructure
// (pixel/postMessage bridge, third-party embeds). Genuine section/app
// errors still fail the test.
const IGNORED_CONSOLE = [
  /Unable to post message to .*Recipient has origin null/i,
  /web-pixels-manager/i,
  /Failed to load resource:.*(status of 40|net::ERR)/i,
];

test.describe('Announcement Bar - Stability', () => {
  test('announcement bar loads without unexpected JavaScript console errors', async ({ page }) => {
    const ab = new AnnouncementBarPage(page);
    const errors = collectErrors(page); // attach BEFORE navigation
    await ab.setDesktopView();
    await ab.open();
    await ab.waitForPageLoad();

    const unexpected = errors.filter(
      (e) => !IGNORED_CONSOLE.some((re) => re.test(e)),
    );
    expect(unexpected, `Unexpected console errors:\n${unexpected.join('\n')}`).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// NOTES — theme defects & requirements intentionally NOT automated
// ─────────────────────────────────────────────────────────────
// 1. THEME DEFECT — the marquee never loops seamlessly.
//    `sections/announcement-bar.liquid` renders exactly one
//    `.announcement-bar__marquee-group`, while the keyframes
//    `announcement-bar-marquee` animate the track by translateX(-50%) — a
//    seamless loop only when the track holds TWO copies of the content.
//    `assets/marquee.js` does build clones, but it queries `.marquee-content`,
//    `.marquee-track` and `.marquee-group`, whereas this section emits
//    `.announcement-bar__marquee`, `-track` and `-group`. The class names never
//    match, so the clone-builder never touches the announcement bar and the
//    strip visibly snaps back mid-scroll. Two tests pin this (group count = 1,
//    JS hooks = 0) so a future theme fix fails loudly rather than silently.
//    Recommended theme fix: align the class names or extend SECTION_CLASSES.
// 2. THEME DEFECT — prefers-reduced-motion is not honoured.
//    marquee.js short-circuits on reduced motion, but (per NOTE 1) it never
//    runs here, and the section's own CSS has no reduced-motion media query.
//    The animation therefore keeps running. Rather than assert a theme
//    limitation as a pass, the a11y suite verifies the message text stays
//    perceivable; stopping the animation is a recommended theme improvement.
// 3. THE PUBLISHED THEME RENDERS NO ANNOUNCEMENT BAR.
//    The store publishes "theme-export-wdt-atles-myshopify-com-kajalsele".
//    Its `sections/announcement-bar.liquid` ships with the theme but is NOT
//    placed in any section group or template, so no announcement bar renders
//    on the live storefront at all. These tests run against an unpublished
//    duplicate ("QA - Announcement Bar (Playwright)", id 188167946607) that
//    adds the section to `sections/header-group.json` in marquee mode.
//    `SHOPIFY_PREVIEW_THEME_ID` in .env selects it; globalSetup plants
//    Shopify's preview cookie. Clear that var to test the published theme,
//    at which point every test here will fail on a missing bar — by design.
// 4. The "above the header" check resolves `<site-header>` from this suite's
//    own locator module. There is no HeaderPage for this theme yet; when one is
//    written, move the `siteHeader` selector into its own header locator file.
// 5. Carousel (Swiper) mode: the section supports `type: carousel` with
//    autoplay, loop, pause-on-hover and prev/next arrows. This store runs
//    marquee mode, so the carousel path is covered only negatively. If the
//    setting is switched, extend the Marquee suite with slide/arrow coverage.
// 6. Marquee pixel travel: asserting the strip actually translates over time is
//    timing/CI-flaky, so behaviour is validated via the computed animation
//    contract (name/duration/direction/iteration/play-state) and the
//    deterministic pause-on-hover interaction instead.
// 7. USABILITY — links inside the marquee are hard to click.
//    The strip never stops moving, so Playwright's actionability check reports
//    "element is not stable" and a plain .click() on an announcement link times
//    out. AnnouncementBarPage.clickLinkedItem() hovers first, letting the
//    theme's pause-on-hover settle the anchor before clicking — which is
//    exactly what a mouse user does. Touch pointers get no hover and therefore
//    no pause, so the method falls back to a forced click to mimic tapping a
//    moving target. That fallback documents a genuine mobile UX weakness of
//    marquee-mode links, not a test shortcut.
