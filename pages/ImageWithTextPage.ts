import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { imageWithTextSelectors as S } from '../locators/image-with-text.locators';

/** A DOM rect as returned by Playwright's `boundingBox()`. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * ImageWithTextPage — Page Object for the "Image with Text" section of the
 * Atles theme ("theme-export-wdt-atles-myshopify-com-kajalsele").
 *
 * Extends BasePage (navigation / viewport / screenshot / console-error
 * helpers). All selectors live in `image-with-text.locators.ts`.
 *
 * Behaviour verified from the live rendered DOM/CSS:
 *   • Two-column flex layout. Below 992px (`lg`) it stacks into a column;
 *     at or above 992px `flex-lg-row` lays it out as a row, with the media
 *     column first because `image_position: left`.
 *   • The image column ships TWO <img> elements. Below 768px (`md`) the
 *     `--mobile` wrap is shown and the desktop wrap is hidden; at or above
 *     768px the reverse. Both wraps are `aria-hidden="true"` — the imagery
 *     is decorative, and the accessible content lives in the text column.
 *   • `--gap` and `--image-width` are inline custom properties on `__inner`,
 *     driven by the `gap` and `image_width` section settings.
 *   • The content column renders, in block order: heading, description,
 *     N bullet points, and a button.
 */
export class ImageWithTextPage extends BasePage {
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
  /** Every image-with-text section on the page — expected to be exactly one. */
  get allSections(): Locator {
    return this.page.locator(S.section);
  }
  get inner(): Locator {
    return this.page.locator(S.inner).first();
  }
  get media(): Locator {
    return this.page.locator(S.media).first();
  }
  get content(): Locator {
    return this.page.locator(S.content).first();
  }

  // ── Image column ───────────────────────────────────────────
  get imageBlock(): Locator {
    return this.page.locator(S.imageBlock).first();
  }
  get imageWraps(): Locator {
    return this.page.locator(S.imageWraps);
  }
  get desktopImageWrap(): Locator {
    return this.page.locator(S.desktopImageWrap).first();
  }
  get mobileImageWrap(): Locator {
    return this.page.locator(S.mobileImageWrap).first();
  }
  get images(): Locator {
    return this.page.locator(S.images);
  }
  get placeholder(): Locator {
    return this.page.locator(S.placeholder);
  }
  get overlay(): Locator {
    return this.page.locator(S.overlay);
  }

  /**
   * The <img> that is actually rendered at the current viewport width.
   * Only one of the two wraps is displayed at a time (Bootstrap `d-md-*`),
   * so `:visible` resolves to exactly one element.
   */
  get visibleImage(): Locator {
    return this.page.locator(`${S.images}:visible`).first();
  }

  // ── Content column ─────────────────────────────────────────
  get textBlocks(): Locator {
    return this.page.locator(S.textBlocks);
  }
  get headingBlock(): Locator {
    return this.page.locator(S.headingBlock).first();
  }
  get descriptionBlock(): Locator {
    return this.page.locator(S.descriptionBlock).first();
  }

  /**
   * The heading element, resolved by ARIA role rather than CSS (the theme
   * emits no semantic heading class). `level` mirrors the block's
   * `type_preset` setting.
   */
  heading(level = 2): Locator {
    return this.content.getByRole('heading', { level });
  }

  get bulletBlocks(): Locator {
    return this.page.locator(S.bulletBlocks);
  }
  get bullets(): Locator {
    return this.page.locator(S.bullets);
  }
  get bulletIcons(): Locator {
    return this.page.locator(S.bulletIcons);
  }
  get bulletTexts(): Locator {
    return this.page.locator(S.bulletTexts);
  }

  get button(): Locator {
    return this.page.locator(S.button).first();
  }
  get disabledButton(): Locator {
    return this.page.locator(S.disabledButton);
  }

  // ── Actions / queries ──────────────────────────────────────

  /** Navigate to a page and wait for the section to attach. */
  async open(path = '/'): Promise<void> {
    await this.goto(path);
    await this.section.waitFor({ state: 'attached' });
  }

  /** Navigate without waiting for the section — used for negative checks. */
  async openWithoutSection(path: string): Promise<void> {
    await this.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Scroll the currently-visible image into view and wait until it has decoded.
   *
   * The theme marks both <img> elements `loading="lazy"`, and BasePage.goto()
   * resolves on `domcontentloaded`, so a freshly-navigated page can reach an
   * assertion before the image has fetched. Resolves on `error` too, so a
   * genuinely broken image still fails the caller's assertion rather than
   * timing out here with a misleading message.
   */
  async waitForVisibleImageLoaded(timeout = 15_000): Promise<void> {
    const img = this.visibleImage;
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(
      (el: HTMLImageElement) =>
        el.complete && el.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              el.addEventListener('load', () => resolve(), { once: true });
              el.addEventListener('error', () => resolve(), { once: true });
            }),
      undefined,
      { timeout },
    );
  }

  /** Trimmed heading text. */
  async headingText(level = 2): Promise<string> {
    return (await this.heading(level).innerText()).trim();
  }

  /** Trimmed description text. */
  async descriptionText(): Promise<string> {
    return (await this.descriptionBlock.innerText()).trim();
  }

  /** Trimmed text of every bullet point, in DOM order. */
  async bulletPointTexts(): Promise<string[]> {
    return (await this.bulletTexts.allInnerTexts()).map((t) => t.trim());
  }

  private computed(locator: Locator, prop: string): Promise<string> {
    return locator.evaluate(
      (el, p) => getComputedStyle(el).getPropertyValue(p),
      prop,
    );
  }

  /** Computed `flex-direction` of the two-column wrapper: `row` or `column`. */
  layoutDirection(): Promise<string> {
    return this.computed(this.inner, 'flex-direction');
  }
  /** Computed `align-items` — driven by the `vertical_alignment` setting. */
  verticalAlignment(): Promise<string> {
    return this.computed(this.inner, 'align-items');
  }
  /** Computed `text-align` of the content column — the `content_alignment` setting. */
  contentTextAlign(): Promise<string> {
    return this.computed(this.content, 'text-align');
  }
  /** Computed column `gap` — the `gap` setting, in px. */
  columnGap(): Promise<string> {
    return this.computed(this.inner, 'gap');
  }
  /** Inline `--image-width` custom property — the `image_width` setting. */
  imageWidthVar(): Promise<string> {
    return this.computed(this.inner, '--image-width').then((v) => v.trim());
  }
  /** Inline `--gap` custom property. */
  gapVar(): Promise<string> {
    return this.computed(this.inner, '--gap').then((v) => v.trim());
  }

  /** Bounding boxes of the media and content columns. Throws if either is unlaid. */
  async columnBoxes(): Promise<{ media: Box; content: Box }> {
    const [media, content] = await Promise.all([
      this.media.boundingBox(),
      this.content.boundingBox(),
    ]);
    if (!media || !content) {
      throw new Error('image-with-text columns have no layout box');
    }
    return { media, content };
  }

  /** True when the media column is laid out to the left of the content column. */
  async imageIsLeftOfContent(): Promise<boolean> {
    const { media, content } = await this.columnBoxes();
    return media.x + media.width <= content.x;
  }

  /** True when the media column is stacked above the content column. */
  async imageIsAboveContent(): Promise<boolean> {
    const { media, content } = await this.columnBoxes();
    return media.y + media.height <= content.y;
  }

  /** `href` of the section's call-to-action button. */
  buttonHref(): Promise<string | null> {
    return this.button.getAttribute('href');
  }

  /** Trimmed label of the call-to-action button. */
  async buttonLabel(): Promise<string> {
    return (await this.button.innerText()).trim();
  }

  /** Click the CTA button and wait for the resulting navigation. */
  async clickButton(): Promise<void> {
    await this.button.click();
    await this.waitForPageLoad();
  }
}

export default ImageWithTextPage;
