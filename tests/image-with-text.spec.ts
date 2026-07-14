// tests/image-with-text.spec.ts
// ─────────────────────────────────────────────────────────────
// "Image with Text" test suite for the published Shopify theme
// "theme-export-wdt-atles-myshopify-com-kajalsele" (a Selena / SHThemes build)
// on abundance-theme.myshopify.com (public, no password protection).
//
// Coverage was derived by inspecting the theme source through the Shopify
// MCP server AND dumping the live rendered storefront DOM/CSS. Verified against
// this store's LIVE configuration:
//   • Two-column flex layout inside `.image-with-text__inner`, with inline
//     `--gap: 32px` and `--image-width: 50%` custom properties.
//   • Bootstrap `lg` (992px) flips the stacked column into a row via
//     `flex-lg-row`. With `image_position: left` the media column then sits
//     to the LEFT of the content column.
//   • The section is in the theme's DEFAULT preset: NO image is uploaded, so
//     the image column renders a single placeholder wrap (SVG, aria-hidden),
//     NOT a real <img> with desktop/mobile variants. The content column has an
//     <h2> "Tell your story", a description, NO bullet points, and a `.btn`
//     linking to /collections/all.
//
// Because no real image is configured, the image-loading / srcset / mobile-swap
// / aspect-ratio / bullet coverage cannot assert against real content; those
// paths are covered by their default-state assertions (placeholder present,
// zero bullets) and documented in NOTES 4–5. Upload an image and add bullet
// blocks in the Theme Editor to unlock the fuller suite.
//
// Architecture: intent lives in pages/ImageWithTextPage.ts (extends BasePage);
// selectors live in locators/image-with-text.locators.ts; shared utilities come
// from utils/helper.js; expected values come from data/testData.json. No
// locators are written inline here.
//
// NOTES — theme limitations, Shopify limits and scenarios NOT automated — are
// documented at the bottom of the file.
// ─────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ImageWithTextPage } from '../pages/ImageWithTextPage';
import { BREAKPOINTS, collectErrors } from '../utils/helper.js';
import testData from '../data/testData.json';

const IWT = testData.imageWithText;

/** Breakpoints at which the theme lays the section out as a row (Bootstrap `lg`). */
const isRowLayout = (width: number): boolean => width >= IWT.rowLayoutMinWidth;

// ═════════════════════════════════════════════════════════════
// 1. STRUCTURE & PRESENCE  (positive)
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - Structure & Presence', () => {
  let iwt: ImageWithTextPage;

  test.beforeEach(async ({ page }) => {
    iwt = new ImageWithTextPage(page);
    await iwt.setDesktopView();
    await iwt.open(IWT.path);
  });

  test('the section renders and is visible', async () => {
    await expect(iwt.section).toBeVisible();
  });

  test('the section is wrapped in its own Shopify section element', async () => {
    await expect(iwt.sectionWrapper).toBeVisible();
  });

  test('the section exposes a stable data-section-id hook', async () => {
    // The DOM id is dynamic, so tests key off the attribute, never the id.
    await expect(iwt.section).toHaveAttribute('data-section-id', /.+/);
  });

  test('the section renders both a media column and a content column', async () => {
    await expect(iwt.media).toBeVisible();
    await expect(iwt.content).toBeVisible();
    await expect(iwt.inner).toBeVisible();
  });

  test('the section applies the configured theme color scheme', async () => {
    await expect(iwt.section).toHaveClass(new RegExp(IWT.colorSchemeClass));
  });

  test('exactly one image-with-text section is rendered on the page', async () => {
    await expect(iwt.allSections).toHaveCount(1);
  });
});

// ═════════════════════════════════════════════════════════════
// 2. CONTENT & VALIDATION
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - Content & Validation', () => {
  let iwt: ImageWithTextPage;

  test.beforeEach(async ({ page }) => {
    iwt = new ImageWithTextPage(page);
    await iwt.setDesktopView();
    await iwt.open(IWT.path);
  });

  test('the heading renders at the configured level with the configured text', async () => {
    await expect(iwt.heading(IWT.headingLevel)).toBeVisible();
    expect(await iwt.headingText(IWT.headingLevel)).toBe(IWT.heading);
  });

  test('the description renders the configured text', async () => {
    await expect(iwt.descriptionBlock).toBeVisible();
    expect(await iwt.descriptionText()).toBe(IWT.description);
  });

  test('heading and description are distinct, non-empty text blocks', async () => {
    await expect(iwt.textBlocks).toHaveCount(2);
    expect(await iwt.headingText(IWT.headingLevel)).not.toEqual('');
    expect(await iwt.descriptionText()).not.toEqual('');
    expect(await iwt.headingText(IWT.headingLevel)).not.toBe(await iwt.descriptionText());
  });

  test('the configured number of bullet points renders', async () => {
    // This store's section has no bullet-point blocks (default preset). The
    // theme supports them; add blocks to raise IWT.bulletCount. See NOTE 5.
    await expect(iwt.bullets).toHaveCount(IWT.bulletCount);
  });

  test('the call-to-action button renders its configured label and destination', async () => {
    await expect(iwt.button).toBeVisible();
    expect(await iwt.buttonLabel()).toBe(IWT.buttonLabel);
    expect(await iwt.buttonHref()).toBe(IWT.buttonHref);
  });

  test('content blocks render in the configured order: heading, description, button', async () => {
    const order = await iwt.content.evaluate((el) =>
      Array.from(el.children)
        .filter((c) => c.tagName !== 'STYLE')
        .map((c) => {
          if (c.querySelector('h1, h2, h3, h4, h5, h6')) return 'heading';
          if (c.classList.contains('bullets_block')) return 'bullet';
          if (c.tagName === 'A') return 'button';
          return 'description';
        }),
    );
    // No bullet blocks in this config.
    expect(order).toEqual(['heading', 'description', 'button']);
  });
});

// ═════════════════════════════════════════════════════════════
// 3. IMAGE COLUMN  (functional / validation)
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - Image column', () => {
  let iwt: ImageWithTextPage;

  test.beforeEach(async ({ page }) => {
    iwt = new ImageWithTextPage(page);
    await iwt.setDesktopView();
    await iwt.open(IWT.path);
  });

  test('the image block renders', async () => {
    await expect(iwt.imageBlock).toBeVisible();
  });

  test('a placeholder is rendered because no image is configured', async () => {
    // `image-with-text-image.liquid` emits the placeholder SVG only when both
    // `image` and `mobile_image` are blank — which is this store's state.
    expect(IWT.hasPlaceholder).toBe(true);
    await expect(iwt.placeholder).toHaveCount(1);
    await expect(iwt.placeholder.first()).toBeVisible();
  });

  test('no real <img> element is present while using the placeholder', async () => {
    // Guards the default state: when a real image is later uploaded, this
    // flips (realImageCount > 0) and flags that testData needs updating.
    expect(IWT.realImageCount).toBe(0);
    await expect(iwt.images).toHaveCount(0);
  });

  test('the placeholder occupies a single image wrap', async () => {
    await expect(iwt.imageWraps).toHaveCount(IWT.imageWrapCount);
  });

  test('no overlay is rendered when enable_overlay is off', async () => {
    expect(IWT.hasOverlay).toBe(false);
    await expect(iwt.overlay).toHaveCount(0);
  });
});

// ═════════════════════════════════════════════════════════════
// 4. UI / LAYOUT  (desktop)
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - UI & Layout', () => {
  let iwt: ImageWithTextPage;

  test.beforeEach(async ({ page }) => {
    iwt = new ImageWithTextPage(page);
    await iwt.setDesktopView();
    await iwt.open(IWT.path);
  });

  test('the section lays out as a row on desktop', async () => {
    expect(await iwt.layoutDirection()).toBe('row');
  });

  test('the image column sits to the left of the content column', async () => {
    // `image_position: left` — the columns must not overlap.
    expect(IWT.imagePosition).toBe('left');
    expect(await iwt.imageIsLeftOfContent()).toBe(true);
  });

  test('the columns are vertically centred', async () => {
    expect(IWT.verticalAlignment).toBe('center');
    expect(await iwt.verticalAlignment()).toBe('center');
  });

  test('the content column uses the configured text alignment', async () => {
    expect(IWT.contentAlignment).toBe('left');
    // `content_alignment: left` → `text-start` → computed `text-align: left`.
    expect(await iwt.contentTextAlign()).toBe('left');
  });

  test('the configured gap and image width are applied as CSS custom properties', async () => {
    expect(await iwt.gapVar()).toBe(IWT.gapVar);
    expect(await iwt.imageWidthVar()).toBe(IWT.imageWidthVar);
    expect(await iwt.columnGap()).toBe(IWT.gapPx);
  });

  test('the media column occupies the configured share of the section width', async () => {
    const { media } = await iwt.columnBoxes();
    const sectionBox = await iwt.inner.boundingBox();
    expect(sectionBox).not.toBeNull();
    const expectedRatio = parseInt(IWT.imageWidthVar, 10) / 100;
    const actualRatio = media.width / sectionBox!.width;
    // 2% tolerance absorbs the flex gap and sub-pixel rounding.
    expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.02);
  });

  test('the section does not overflow the viewport horizontally', async ({ page }) => {
    const box = await iwt.section.boundingBox();
    const innerWidth = await page.evaluate(() => window.innerWidth);
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(innerWidth + 1);
  });
});

// ═════════════════════════════════════════════════════════════
// 5. FUNCTIONAL  (the CTA is the section's only interaction)
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - Functional', () => {
  let iwt: ImageWithTextPage;

  test.beforeEach(async ({ page }) => {
    iwt = new ImageWithTextPage(page);
    await iwt.setDesktopView();
    await iwt.open(IWT.path);
  });

  test('clicking the call-to-action navigates to its destination', async ({ page }) => {
    await iwt.clickButton();
    expect(new URL(page.url()).pathname).toBe(IWT.buttonHref);
  });

  test('the call-to-action opens in the same tab', async () => {
    // `open_in_new_tab: false` — no target/rel is emitted.
    await expect(iwt.button).not.toHaveAttribute('target', '_blank');
  });

  test('the call-to-action is a real, enabled link', async () => {
    // `blocks/button.liquid` emits role="link" aria-disabled="true" ONLY when a
    // label is set with no link. A configured link must not be disabled.
    await expect(iwt.disabledButton).toHaveCount(0);
    await expect(iwt.button).toHaveAttribute('href', IWT.buttonHref);
  });

  test('the call-to-action is keyboard focusable and activatable', async ({ page }) => {
    await iwt.button.focus();
    await expect(iwt.button).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL(new RegExp(`${IWT.buttonHref}$`));
    expect(new URL(page.url()).pathname).toBe(IWT.buttonHref);
  });
});

// ═════════════════════════════════════════════════════════════
// 6. RESPONSIVE  (integrity across breakpoints)
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - Responsive', () => {
  for (const bp of BREAKPOINTS) {
    test(`renders correctly at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      const iwt = new ImageWithTextPage(page);
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await iwt.open(IWT.path);

      await expect(iwt.section).toBeVisible();
      await expect(iwt.heading(IWT.headingLevel)).toBeVisible();
      await expect(iwt.button).toBeVisible();
      await expect(iwt.bullets).toHaveCount(IWT.bulletCount);

      // Layout flips to a row at Bootstrap `lg` (992px).
      const expectedDirection = isRowLayout(bp.width) ? 'row' : 'column';
      expect(await iwt.layoutDirection()).toBe(expectedDirection);

      if (isRowLayout(bp.width)) {
        expect(await iwt.imageIsLeftOfContent()).toBe(true);
      } else {
        // Stacked: media column sits above the content column.
        expect(await iwt.imageIsAboveContent()).toBe(true);
      }

      // The placeholder image column is present at every width.
      await expect(iwt.imageBlock).toBeVisible();
      await expect(iwt.placeholder).toHaveCount(1);
    });
  }
});

// ═════════════════════════════════════════════════════════════
// 7. BOUNDARY  (exact breakpoint edges, one pixel either side)
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - Breakpoint boundaries', () => {
  const HEIGHT = 900;

  test('layout is a column at 991px and a row at 992px (Bootstrap lg edge)', async ({ page }) => {
    const iwt = new ImageWithTextPage(page);
    const lg = IWT.rowLayoutMinWidth;

    await page.setViewportSize({ width: lg - 1, height: HEIGHT });
    await iwt.open(IWT.path);
    expect(await iwt.layoutDirection(), `at ${lg - 1}px the section should stack`).toBe('column');

    await page.setViewportSize({ width: lg, height: HEIGHT });
    await expect
      .poll(() => iwt.layoutDirection(), { message: `at ${lg}px the section should be a row` })
      .toBe('row');
  });

  test('the section survives an extremely narrow viewport without overflowing', async ({ page }) => {
    // Scoped to the image-with-text section's own box. (Document-level
    // horizontal scroll at 320px is caused by the announcement bar's marquee
    // track, a different section — that belongs to the announcement-bar suite,
    // not here.)
    const iwt = new ImageWithTextPage(page);
    await page.setViewportSize({ width: 320, height: HEIGHT });
    await iwt.open(IWT.path);

    await expect(iwt.section).toBeVisible();
    const box = await iwt.section.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(321);

    // The section's own content must not overflow its box horizontally.
    const sectionOverflows = await iwt.section.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1,
    );
    expect(sectionOverflows, 'the section must not scroll horizontally at 320px').toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════
// 8. ACCESSIBILITY
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - Accessibility', () => {
  let iwt: ImageWithTextPage;

  test.beforeEach(async ({ page }) => {
    iwt = new ImageWithTextPage(page);
    await iwt.setDesktopView();
    await iwt.open(IWT.path);
  });

  test('the section has no critical or serious axe violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).include('.image-with-text').analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(
      blocking,
      `Critical/serious a11y violations:\n${blocking.map((v) => `• ${v.id}: ${v.help}`).join('\n')}`,
    ).toEqual([]);
  });

  test('decorative imagery is hidden from the accessibility tree', async () => {
    // The image wrap (placeholder here) carries aria-hidden="true", keeping the
    // decorative SVG out of the a11y tree. See NOTE 1.
    const wraps = await iwt.imageWraps.all();
    expect(wraps.length).toBe(IWT.imageWrapCount);
    for (const wrap of wraps) {
      await expect(wrap).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('the heading is exposed to assistive technology at the right level', async () => {
    await expect(iwt.heading(IWT.headingLevel)).toHaveText(IWT.heading);
  });

  test('the call-to-action is exposed as a named link', async ({ page }) => {
    const link = page.getByRole('link', { name: IWT.buttonLabel, exact: true });
    await expect(link.first()).toBeVisible();
  });

  test('section content remains perceivable under reduced motion', async ({ page }) => {
    // The section has no animation, so reduced motion must be a no-op.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await iwt.open(IWT.path);
    await expect(iwt.section).toBeVisible();
    expect(await iwt.headingText(IWT.headingLevel)).toBe(IWT.heading);
    await expect(iwt.button).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════
// 9. EDGE CASES / NEGATIVE
// ═════════════════════════════════════════════════════════════
test.describe('Image with Text - Edge cases', () => {
  test('the section is not rendered on templates that do not include it', async ({ page }) => {
    // `image-with-text` is a template section (not a header/footer group
    // section), so it must NOT leak onto other templates.
    const iwt = new ImageWithTextPage(page);
    await iwt.setDesktopView();
    await iwt.openWithoutSection(IWT.notRenderedOn);
    await expect(iwt.allSections).toHaveCount(0);
  });

  test('the content column never collapses to zero width', async ({ page }) => {
    // `min-w-0` on the content column allows shrink; guard against a regression
    // that lets the 50% image column squeeze the text out entirely.
    const iwt = new ImageWithTextPage(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await iwt.open(IWT.path);
    const { content } = await iwt.columnBoxes();
    expect(content.width).toBeGreaterThan(0);
  });
});

// ═════════════════════════════════════════════════════════════
// 10. STABILITY
// ═════════════════════════════════════════════════════════════

// Known-benign console noise emitted by Shopify/theme infrastructure
// (pixel/postMessage bridge, third-party embeds). Genuine section/app
// errors still fail the test.
const IGNORED_CONSOLE = [
  /Unable to post message to .*Recipient has origin null/i,
  /web-pixels-manager/i,
  /Failed to load resource:.*(status of 40|net::ERR)/i,
];

test.describe('Image with Text - Stability', () => {
  test('the section loads without unexpected JavaScript console errors', async ({ page }) => {
    const iwt = new ImageWithTextPage(page);
    const errors = collectErrors(page); // attach BEFORE navigation
    await iwt.setDesktopView();
    await iwt.open(IWT.path);
    await iwt.waitForPageLoad();

    const unexpected = errors.filter((e) => !IGNORED_CONSOLE.some((re) => re.test(e)));
    expect(unexpected, `Unexpected console errors:\n${unexpected.join('\n')}`).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// NOTES — theme limitations, Shopify limits & scenarios NOT automated
// ─────────────────────────────────────────────────────────────
// 1. THEME DEFECT (latent) — the real <img> path emits no `alt` attribute.
//    When an image IS configured, `blocks/image-with-text-image.liquid` passes
//    `alt: media_image.alt` to `image_tag`; if the media file's alt is empty,
//    Liquid passes nil and `image_tag` omits the attribute entirely rather than
//    emitting `alt=""`. Such an image would only avoid an axe violation because
//    its wrapper is `aria-hidden="true"`. This store currently uses the
//    placeholder (no <img>), so the defect is dormant, but the a11y suite
//    asserts the aria-hidden contract that will hold the real-image path
//    together. Recommended theme fix: `alt: media_image.alt | default: ''`.
//
// 2. STORE & RENDERING — runs against the LIVE published theme.
//    Target store: abundance-theme.myshopify.com (public, no password). Its
//    published Atles theme places one image-with-text section on the home
//    template, so it renders on the live storefront homepage with no theme
//    duplicate or preview cookie. `data/testData.json → imageWithText` mirrors
//    that live config. If the section's settings change in the Theme Editor,
//    refresh that block to match.
//
// 3. CROSS-BROWSER coverage is limited by the framework's project matrix.
//    `playwright.config.ts` defines three projects — Desktop Chrome, iPad
//    (gen 7) and iPhone 13 — ALL Chromium. Nothing in this spec is
//    Chromium-specific, so it will run unchanged on Firefox and WebKit; genuine
//    cross-browser coverage requires adding `firefox` and `webkit` projects.
//    That is a framework-wide change, so it is called out rather than made
//    silently.
//
// 4. IMAGE coverage is bounded by the live configuration (no image uploaded).
//    The theme supports a desktop image, a separate mobile image (swapped at
//    Bootstrap `md` = 768px), `square`/`portrait`/`landscape`/`auto` aspect
//    ratios, a colour/gradient overlay, and border styles. NONE are active
//    here — the section uses the placeholder. So the image-loading, `srcset`,
//    mobile/desktop swap, aspect-ratio and overlay tests are represented only
//    by their default-state assertions (placeholder present, no <img>, no
//    overlay). Upload an image (and a mobile image) in the Theme Editor, set
//    IWT.realImageCount / hasPlaceholder / imageWrapCount accordingly, and add
//    the image-swap + load + srcset tests to exercise the full path. The page
//    object already ships `visibleImage` and `waitForVisibleImageLoaded()` for
//    exactly that.
//
// 5. BULLET points are bounded by the live configuration (none configured).
//    The section supports repeatable `bullet-points` blocks (icon + text). This
//    store has zero, so `bulletCount` is 0 and the suite asserts their absence.
//    Add blocks in the Theme Editor and raise IWT.bulletCount to cover bullet
//    text, order and icon rendering.
//
// 6. Settings-permutation coverage (image_position: right, other alignments,
//    overlay, borders) needs the setting toggled. Shopify offers no storefront
//    API to mutate theme settings mid-run, so these are covered only in their
//    current state. To extend: reconfigure the section (or a second instance)
//    and parameterise `IWT` over both configurations.
//
// 7. `image_width` is a desktop-only setting. Below Bootstrap `lg` (992px) the
//    theme forces both columns to `width: 100%`, so `--image-width` is present
//    in the DOM but has no layout effect. The width ratio is asserted only at
//    desktop.
