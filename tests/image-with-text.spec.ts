// tests/image-with-text.spec.ts
// ─────────────────────────────────────────────────────────────
// "Image with Text" test suite for the published Shopify theme
// "theme-export-wdt-atles-myshopify-com-kajalsele" (a Selena / SHThemes
// build) on wdtsanthanalakshmi.myshopify.com.
//
// Coverage was derived by inspecting the theme source through the Shopify
// MCP server AND dumping the live rendered storefront DOM/CSS. Verified:
//   • Two-column flex layout inside `.image-with-text__inner`, with inline
//     `--gap: 32px` and `--image-width: 50%` custom properties.
//   • Bootstrap `lg` (992px) flips the stacked column into a row via
//     `flex-lg-row`. With `image_position: left` the media column then sits
//     to the LEFT of the content column.
//   • Bootstrap `md` (768px) swaps the images: below it the `--mobile` wrap
//     is shown, at/above it the desktop wrap. These are two DIFFERENT
//     breakpoints — the layout flip and the image swap do not coincide.
//   • Both image wraps carry `aria-hidden="true"`: the imagery is decorative
//     and all accessible content lives in the text column.
//   • Content column renders, in block order: an <h2> heading, a description,
//     two bullet points (icon + text), and a `.btn` linking to /collections/all.
//
// Architecture: intent lives in pages/ImageWithTextPage.ts (extends BasePage);
// selectors live in locators/image-with-text.locators.ts; shared utilities come
// from utils/helper.js; expected values come from data/testData.json. No
// locators are written inline here.
//
// NOTES — theme defects, Shopify limitations and scenarios that are
// intentionally NOT automated — are documented at the bottom of the file.
// ─────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ImageWithTextPage } from '../pages/ImageWithTextPage';
import { BREAKPOINTS, collectErrors, expectImageLoaded } from '../utils/helper.js';
import testData from '../data/testData.json';

const IWT = testData.imageWithText;

/** Breakpoints at which the theme lays the section out as a row (Bootstrap `lg`). */
const isRowLayout = (width: number): boolean => width >= IWT.rowLayoutMinWidth;
/** Breakpoints at which the desktop image (not the mobile one) is shown (Bootstrap `md`). */
const showsDesktopImage = (width: number): boolean => width >= IWT.desktopImageMinWidth;

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

  test('every configured bullet point renders, in order', async () => {
    await expect(iwt.bullets).toHaveCount(IWT.bulletCount);
    expect(await iwt.bulletPointTexts()).toEqual(IWT.bullets);
  });

  test('every bullet point renders a non-empty label', async () => {
    const texts = await iwt.bulletPointTexts();
    expect(texts.length).toBeGreaterThan(0);
    for (const [i, t] of texts.entries()) {
      expect(t, `bullet #${i} should not be empty`).not.toEqual('');
    }
  });

  test('every bullet point renders its icon at the configured size', async () => {
    await expect(iwt.bulletIcons).toHaveCount(IWT.bulletCount);
    const bullets = await iwt.bullets.all();
    for (const bullet of bullets) {
      const size = await bullet.evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--icon-size').trim(),
      );
      expect(size).toBe(IWT.iconSizePx);
    }
  });

  test('the call-to-action button renders its configured label and destination', async () => {
    await expect(iwt.button).toBeVisible();
    expect(await iwt.buttonLabel()).toBe(IWT.buttonLabel);
    expect(await iwt.buttonHref()).toBe(IWT.buttonHref);
  });

  test('content blocks render in the configured order: heading, description, bullets, button', async () => {
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
    expect(order).toEqual(['heading', 'description', 'bullet', 'bullet', 'button']);
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

  test('the image block renders both a desktop and a mobile image wrap', async () => {
    await expect(iwt.imageBlock).toBeVisible();
    await expect(iwt.imageWraps).toHaveCount(IWT.imageCount);
    await expect(iwt.images).toHaveCount(IWT.imageCount);
  });

  test('the desktop image wrap applies the configured aspect ratio', async () => {
    await expect(iwt.desktopImageWrap).toHaveClass(new RegExp(IWT.aspectRatioClass));
  });

  test('the visible image actually loads (non-zero natural width)', async () => {
    // The images are lazy-loaded, so settle them first, then assert with the
    // shared expectImageLoaded helper from utils/helper.js.
    await iwt.waitForVisibleImageLoaded();
    await expectImageLoaded(iwt.visibleImage);
  });

  test('images are lazy-loaded and responsive (srcset + sizes)', async () => {
    await expect(iwt.visibleImage).toHaveAttribute('loading', 'lazy');
    await expect(iwt.visibleImage).toHaveAttribute('sizes', /.+/);
    // image_tag emits a multi-width candidate list, e.g. "…&width=480 480w, …".
    const srcset = await iwt.visibleImage.getAttribute('srcset');
    expect(srcset).toBeTruthy();
    const candidates = srcset!.split(',').filter((c) => /\d+w\s*$/.test(c.trim()));
    expect(candidates.length).toBeGreaterThan(1);
  });

  test('no placeholder is rendered when an image is configured', async () => {
    // `image-with-text-image.liquid` only emits the placeholder SVG when both
    // `image` and `mobile_image` are blank.
    expect(IWT.hasPlaceholder).toBe(false);
    await expect(iwt.placeholder).toHaveCount(0);
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
// 6. RESPONSIVE  (integrity across breakpoints + boundary values)
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
        // `mobile_image_position: top` — media stacks above the content.
        expect(IWT.mobileImagePosition).toBe('top');
        expect(await iwt.imageIsAboveContent()).toBe(true);
      }

      // Image swap happens at a DIFFERENT breakpoint — Bootstrap `md` (768px).
      if (showsDesktopImage(bp.width)) {
        await expect(iwt.desktopImageWrap).toBeVisible();
        await expect(iwt.mobileImageWrap).toBeHidden();
      } else {
        await expect(iwt.mobileImageWrap).toBeVisible();
        await expect(iwt.desktopImageWrap).toBeHidden();
      }

      // Whichever image is shown must actually decode (they are lazy-loaded).
      await iwt.waitForVisibleImageLoaded();
      await expectImageLoaded(iwt.visibleImage);
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

  test('mobile image shows at 767px and desktop image at 768px (Bootstrap md edge)', async ({ page }) => {
    const iwt = new ImageWithTextPage(page);
    const md = IWT.desktopImageMinWidth;

    await page.setViewportSize({ width: md - 1, height: HEIGHT });
    await iwt.open(IWT.path);
    await expect(iwt.mobileImageWrap, `at ${md - 1}px the mobile image should show`).toBeVisible();
    await expect(iwt.desktopImageWrap).toBeHidden();

    await page.setViewportSize({ width: md, height: HEIGHT });
    await expect(iwt.desktopImageWrap, `at ${md}px the desktop image should show`).toBeVisible();
    await expect(iwt.mobileImageWrap).toBeHidden();
  });

  test('the layout flip and the image swap are independent breakpoints', async ({ page }) => {
    // Between md (768) and lg (992) the section still stacks, but already
    // shows the DESKTOP image. This gap is easy to regress, so pin it.
    const iwt = new ImageWithTextPage(page);
    await page.setViewportSize({ width: 800, height: HEIGHT });
    await iwt.open(IWT.path);

    expect(await iwt.layoutDirection()).toBe('column');
    await expect(iwt.desktopImageWrap).toBeVisible();
    await expect(iwt.mobileImageWrap).toBeHidden();
  });

  test('the section survives an extremely narrow viewport without overflowing', async ({ page }) => {
    const iwt = new ImageWithTextPage(page);
    await page.setViewportSize({ width: 320, height: HEIGHT });
    await iwt.open(IWT.path);

    await expect(iwt.section).toBeVisible();
    const box = await iwt.section.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(321);

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalScroll, 'page must not scroll horizontally at 320px').toBe(false);
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
    // Both wraps carry aria-hidden="true". This is what keeps the theme's
    // alt-less <img> elements from becoming an a11y violation. See NOTE 1.
    const wraps = await iwt.imageWraps.all();
    expect(wraps.length).toBe(IWT.imageCount);
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

  test('bullet icons are presentational and carry no accessible name', async () => {
    // The icons are inline <svg> with no <title>/aria-label; the adjacent
    // .bullet-point__text carries the meaning. Assert the text is what is
    // exposed, so a screen reader never announces a bare icon.
    const texts = await iwt.bulletPointTexts();
    expect(texts).toEqual(IWT.bullets);
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

  test('the section exposes no placeholder image when configured with a real image', async ({ page }) => {
    const iwt = new ImageWithTextPage(page);
    await iwt.setDesktopView();
    await iwt.open(IWT.path);
    await expect(iwt.placeholder).toHaveCount(0);
    // Shopify serves theme images from the shop's own CDN path, not from
    // cdn.shopify.com, and image_tag emits a width-keyed candidate list.
    await expect(iwt.images.first()).toHaveAttribute('srcset', /\/cdn\/shop\/files\/.+width=\d+\s+\d+w/);
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
// NOTES — theme defects, Shopify limits & scenarios NOT automated
// ─────────────────────────────────────────────────────────────
// 1. THEME DEFECT — the <img> elements carry no `alt` attribute at all.
//    `blocks/image-with-text-image.liquid` passes `alt: desktop_media_image.alt`
//    to `image_tag`. The store's media files have an EMPTY alt, so Liquid
//    passes nil and `image_tag` omits the attribute entirely (rather than
//    emitting `alt=""`). The images escape being an axe violation only because
//    their wrapper is `aria-hidden="true"`. That is fragile: remove the
//    aria-hidden and the section instantly fails WCAG 1.1.1. Recommended theme
//    fix: emit `alt: desktop_media_image.alt | default: ''` so a decorative
//    image is explicitly marked as such. The a11y suite asserts the
//    aria-hidden contract that currently holds this together.
//
// 2. THE PUBLISHED THEME RENDERS NO IMAGE-WITH-TEXT SECTION — and no homepage.
//    The published theme ships `sections/image-with-text.liquid`, but it is not
//    placed in any template or section group. Worse, the theme has NO
//    `templates/index.json` at all, so the storefront homepage falls through to
//    the 404 template and literally renders `<h1>404</h1>`.
//    These tests run against an unpublished duplicate ("QA - Announcement Bar
//    (Playwright)", theme id 188167946607) in which `templates/index.json` was
//    created with a single image-with-text section. `SHOPIFY_PREVIEW_THEME_ID`
//    in .env selects it and globalSetup plants Shopify's preview cookie. Clear
//    that variable and every test here fails on a missing section — by design.
//
// 3. CROSS-BROWSER coverage is limited by the framework's project matrix.
//    `playwright.config.ts` defines three projects — Desktop Chrome, iPad
//    (gen 7) and iPhone 13 — ALL of which are Chromium. Nothing in this spec is
//    Chromium-specific (no `-webkit-`/`-moz-` assertions, no engine-only APIs),
//    so it will run unchanged on Firefox and WebKit; but genuine cross-browser
//    coverage requires adding `firefox` and `webkit` projects to the config.
//    That is a framework-wide change affecting every suite, so it is called out
//    here rather than made silently.
//
// 4. Settings-permutation coverage is bounded by the live configuration.
//    `image_position: right`, `vertical_alignment: top|bottom`,
//    `content_alignment: center|right`, `mobile_image_position: bottom`,
//    `enable_overlay`, the border styles, the `square`/`portrait`/`auto` aspect
//    ratios, and the blank-image placeholder path are all supported by the
//    theme but are NOT active in this store. Asserting them would require
//    mutating theme settings mid-run, which Shopify offers no storefront API
//    for. They are covered only negatively (placeholder/overlay absence). To
//    extend: duplicate the section with a second configuration and parameterise
//    `IWT` over both.
//
// 5. `image_width` is a desktop-only setting. Below Bootstrap `lg` (992px) the
//    theme's CSS forces both columns to `width: 100%`, so the `--image-width`
//    custom property is present in the DOM but has no layout effect. The width
//    ratio is therefore asserted only at desktop.
//
// 6. The content column is `position: sticky; top: 0` at ≥992px. Asserting
//    sticky travel requires scrolling a taller-than-viewport section and is
//    inherently timing-sensitive; the computed contract is left unasserted
//    rather than introducing a flaky scroll test.
