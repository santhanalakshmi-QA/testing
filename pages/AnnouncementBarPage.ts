import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { announcementBarSelectors as S } from '../locators/announcement-bar.locators';

/**
 * AnnouncementBarPage — Page Object for the Lollipop storefront
 * announcement bar (the horizontal scrolling marquee pinned above the
 * header on every page).
 *
 * Extends BasePage (navigation / viewport / screenshot / console-error
 * helpers). All selectors live in `announcement-bar.locators.ts` and are
 * scoped to `.announcement-bar-section` so they never collide with the
 * home-page wave-marquee, which shares the `.marquee_annoucement` class.
 *
 * Behaviour verified from the live DOM/CSS:
 *   • Marquee is a CSS animation (`scroll-left` … linear infinite).
 *   • Two identical tracks; the second carries `inert` (seamless loop +
 *     removed from the accessibility tree).
 *   • The marquee pauses on hover (`:hover` → animation-play-state: paused).
 *   • No dismiss control — the bar is persistent.
 */
export class AnnouncementBarPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Regions ────────────────────────────────────────────────
  get sectionWrapper(): Locator {
    return this.page.locator(S.sectionWrapper).first();
  }
  get section(): Locator {
    return this.page.locator(S.section).first();
  }
  get container(): Locator {
    return this.page.locator(S.container).first();
  }
  get bar(): Locator {
    return this.page.locator(S.bar).first();
  }
  get horizontal(): Locator {
    return this.page.locator(S.horizontal).first();
  }
  get viewport(): Locator {
    return this.page.locator(S.viewport).first();
  }

  // ── Marquee tracks ─────────────────────────────────────────
  get tracks(): Locator {
    return this.page.locator(S.track);
  }
  get activeTrack(): Locator {
    return this.page.locator(S.activeTrack).first();
  }
  get duplicateTrack(): Locator {
    return this.page.locator(S.duplicateTrack).first();
  }

  // ── Announcement blocks / messages ─────────────────────────
  get blocks(): Locator {
    return this.page.locator(S.block);
  }
  get messages(): Locator {
    return this.page.locator(S.message);
  }
  /** Blocks that belong to the active (non-inert) track only. */
  activeBlocks(): Locator {
    return this.activeTrack.locator(S.blockRel);
  }
  /** Message paragraphs of the active track only. */
  activeMessages(): Locator {
    return this.activeTrack.locator(S.messageRel);
  }

  // ── Controls the theme does NOT render (negative assertions) ─
  get closeButton(): Locator {
    return this.page.locator(S.closeButton);
  }
  get swiper(): Locator {
    return this.page.locator(S.swiper);
  }

  // ── Actions / queries ──────────────────────────────────────

  /** Navigate to a page and wait for the announcement bar to attach. */
  async open(path = '/'): Promise<void> {
    await this.goto(path);
    await this.section.waitFor({ state: 'attached' });
  }

  /** Trimmed text of every message in the active track. */
  async activeMessageTexts(): Promise<string[]> {
    return (await this.activeMessages().allInnerTexts()).map((t) => t.trim());
  }

  private computed(locator: Locator, prop: string): Promise<string> {
    return locator.evaluate(
      (el, p) => getComputedStyle(el).getPropertyValue(p),
      prop,
    );
  }

  /** Computed CSS `animation-name` of the active marquee track. */
  animationName(): Promise<string> {
    return this.computed(this.activeTrack, 'animation-name');
  }
  /** Computed CSS `animation-iteration-count` of the active track. */
  animationIterationCount(): Promise<string> {
    return this.computed(this.activeTrack, 'animation-iteration-count');
  }
  /** Computed CSS `animation-play-state` of the active track. */
  animationPlayState(): Promise<string> {
    return this.computed(this.activeTrack, 'animation-play-state');
  }
  /** Computed CSS `white-space` of the clipping viewport. */
  viewportWhiteSpace(): Promise<string> {
    return this.computed(this.viewport, 'white-space');
  }
  /** Computed CSS `overflow-x` of the clipping viewport. */
  viewportOverflowX(): Promise<string> {
    return this.computed(this.viewport, 'overflow-x');
  }

  /** Hover the marquee to trigger the theme's pause-on-hover behaviour. */
  async hoverBar(): Promise<void> {
    await this.horizontal.hover();
  }

  /** Whether the current pointer environment supports hover (i.e. desktop). */
  supportsHover(): Promise<boolean> {
    return this.page.evaluate(() => matchMedia('(hover: hover)').matches);
  }
}

export default AnnouncementBarPage;
