import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { announcementBarSelectors as S } from '../locators/announcement-bar.locators';

/**
 * AnnouncementBarPage — Page Object for the storefront announcement bar of the
 * published Atles theme ("theme-export-wdt-atles-myshopify-com-kajalsele",
 * a Selena / SHThemes build).
 *
 * Extends BasePage (navigation / viewport / screenshot / console-error helpers).
 * All selectors live in `announcement-bar.locators.ts`.
 *
 * Behaviour verified from the live rendered DOM/CSS:
 *   • The section belongs to the `header-group`, so the bar renders above the
 *     <site-header> on every template and survives navigation.
 *   • Marquee mode: a single `.announcement-bar__marquee-group` inside
 *     `.announcement-bar__marquee-track`, animated by the CSS keyframes
 *     `announcement-bar-marquee` (30s, linear, infinite, normal direction).
 *   • Pause-on-hover is CSS-driven, gated on `[data-pause-hover="true"]`.
 *   • No dismiss control — the bar is persistent.
 *   • Carousel (Swiper) mode, social icons and the localization slot are all
 *     available in the theme but disabled in this store's config.
 *
 * Method names mirror the theme's own vocabulary: marquee / track / group / item.
 */
export class AnnouncementBarPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Regions ────────────────────────────────────────────────
  get sectionWrapper(): Locator {
    return this.page.locator(S.sectionWrapper).first();
  }
  /** The announcement bar root (`.announcement-bar`). */
  get section(): Locator {
    return this.page.locator(S.section).first();
  }
  /** Every announcement bar on the page — expected to be exactly one. */
  get allSections(): Locator {
    return this.page.locator(S.section);
  }
  get inner(): Locator {
    return this.page.locator(S.inner).first();
  }
  get content(): Locator {
    return this.page.locator(S.content).first();
  }

  // ── Marquee ────────────────────────────────────────────────
  /** The clipping viewport that carries `data-pause-hover`. */
  get marquee(): Locator {
    return this.page.locator(S.marquee).first();
  }
  /** The animated strip. */
  get track(): Locator {
    return this.page.locator(S.track).first();
  }
  /** Every marquee group in the track (Liquid renders exactly one). */
  get groups(): Locator {
    return this.page.locator(S.group);
  }

  // ── Announcement items / messages ──────────────────────────
  get items(): Locator {
    return this.page.locator(S.item);
  }
  get itemTexts(): Locator {
    return this.page.locator(S.itemText);
  }
  get itemLinks(): Locator {
    return this.page.locator(S.itemLink);
  }

  // ── Modes / slots the theme does NOT render here ───────────
  get swiper(): Locator {
    return this.page.locator(S.swiper);
  }
  get swiperSlides(): Locator {
    return this.page.locator(S.swiperSlide);
  }
  get navButtons(): Locator {
    return this.page.locator(S.navButtons);
  }
  get social(): Locator {
    return this.page.locator(S.social);
  }
  get localization(): Locator {
    return this.page.locator(S.localization);
  }
  get edgeFade(): Locator {
    return this.page.locator(S.edgeFade);
  }
  get closeButton(): Locator {
    return this.page.locator(S.closeButton);
  }

  // ── Neighbouring region ────────────────────────────────────
  /** This theme's header is a `<site-header>` custom element. */
  get siteHeader(): Locator {
    return this.page.locator(S.siteHeader).first();
  }
  /** The theme's main content wrapper — the bar always renders above it. */
  get siteMain(): Locator {
    return this.page.locator(S.siteMain).first();
  }

  /** Elements the theme's own `marquee.js` looks for (it finds none here). */
  get jsMarqueeHooks(): Locator {
    return this.page.locator(
      `${S.jsMarqueeContent}, ${S.jsMarqueeTrack}, ${S.jsMarqueeGroup}`,
    );
  }

  // ── Actions / queries ──────────────────────────────────────

  /** Navigate to a page and wait for the announcement bar to attach. */
  async open(path = '/'): Promise<void> {
    await this.goto(path);
    await this.section.waitFor({ state: 'attached' });
  }

  /**
   * Authored (untransformed) text of every announcement item.
   * Uses textContent, not innerText, so the CSS `text-transform: uppercase`
   * does not leak into the assertion — the values stay comparable to the
   * strings authored in theme settings and stored in data/testData.json.
   */
  async messages(): Promise<string[]> {
    return (await this.itemTexts.allTextContents()).map((t) => t.trim());
  }

  /** `href` of every announcement item that was configured with a link. */
  async linkHrefs(): Promise<string[]> {
    return (await this.itemLinks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    )) as string[];
  }

  /** The `data-type` the section renders in: `marquee` or `carousel`. */
  displayType(): Promise<string | null> {
    return this.section.getAttribute('data-type');
  }

  /** Whether the theme's pause-on-hover setting is switched on. */
  async pauseOnHoverEnabled(): Promise<boolean> {
    return (await this.marquee.getAttribute('data-pause-hover')) === 'true';
  }

  private computed(locator: Locator, prop: string): Promise<string> {
    return locator.evaluate(
      (el, p) => getComputedStyle(el).getPropertyValue(p),
      prop,
    );
  }

  /** Computed CSS `animation-name` of the marquee track. */
  animationName(): Promise<string> {
    return this.computed(this.track, 'animation-name');
  }
  /** Computed CSS `animation-duration` of the marquee track. */
  animationDuration(): Promise<string> {
    return this.computed(this.track, 'animation-duration');
  }
  /** Computed CSS `animation-iteration-count` of the marquee track. */
  animationIterationCount(): Promise<string> {
    return this.computed(this.track, 'animation-iteration-count');
  }
  /** Computed CSS `animation-play-state` of the marquee track. */
  animationPlayState(): Promise<string> {
    return this.computed(this.track, 'animation-play-state');
  }
  /** Computed CSS `animation-direction` of the marquee track (`normal` | `reverse`). */
  animationDirection(): Promise<string> {
    return this.computed(this.track, 'animation-direction');
  }
  /** Computed CSS `overflow` of the clipping marquee viewport. */
  marqueeOverflow(): Promise<string> {
    return this.computed(this.marquee, 'overflow');
  }
  /** Computed CSS `white-space` of the first announcement item. */
  itemWhiteSpace(): Promise<string> {
    return this.computed(this.items.first(), 'white-space');
  }
  /** Computed CSS `text-transform` of the first announcement item's text. */
  itemTextTransform(): Promise<string> {
    return this.computed(this.itemTexts.first(), 'text-transform');
  }

  /** Hover the marquee to trigger the theme's pause-on-hover behaviour. */
  async hoverMarquee(): Promise<void> {
    await this.marquee.hover();
  }

  /**
   * Click the first linked announcement item.
   *
   * The marquee translates continuously, so Playwright's actionability check
   * never sees the anchor as "stable" and a plain .click() times out. A real
   * user resolves this the same way: hovering pauses the marquee (the theme's
   * `[data-pause-hover="true"]` CSS rule), and the now-stationary link can be
   * clicked. On pointers without hover (touch), no pause is possible — the user
   * taps a moving target — so the click is forced to mimic that tap.
   */
  async clickLinkedItem(): Promise<void> {
    const link = this.itemLinks.first();
    if (await this.supportsHover()) {
      await this.hoverMarquee();
      await link.click();
    } else {
      await link.click({ force: true });
    }
  }

  /** Move the pointer off the bar so the marquee resumes. */
  async unhoverMarquee(): Promise<void> {
    await this.page.mouse.move(0, 0);
  }

  /** Whether the current pointer environment supports hover (i.e. desktop). */
  supportsHover(): Promise<boolean> {
    return this.page.evaluate(() => matchMedia('(hover: hover)').matches);
  }
}

export default AnnouncementBarPage;
