// locators/image-with-text.locators.ts
// ─────────────────────────────────────────────────────────────
// CSS selectors for the "Image with Text" section of the published Shopify
// theme "theme-export-wdt-atles-myshopify-com-kajalsele" (a Selena / SHThemes
// build) on wdtsanthanalakshmi.myshopify.com.
//
// Verified against the LIVE rendered DOM (not the Liquid source) via the
// Shopify MCP server + a storefront DOM dump. The section id is dynamic
// (#image-with-text-template--27422757880175__image_with_text) so it is NEVER
// hard-coded; everything hangs off stable theme class hooks:
//
//   section.shopify-section.shopify-section--image-with-text   (wrapper)
//     └─ .image-with-text.color-scheme-1  [data-section-id]
//         └─ .full-width                              (layout-width wrapper)
//             └─ .image-with-text__inner.d-flex.flex-column.flex-lg-row
//                │  --gap: 32px; --image-width: 50%
//                ├─ .image-with-text__media            (order-1 order-md-0)
//                │   └─ .image-with-text-image
//                │       ├─ .image-with-text-image__wrap.ratio.ratio-4x3
//                │       │     [aria-hidden] d-none d-md-block   (desktop img)
//                │       │     └─ img.image-with-text-image__img
//                │       └─ .image-with-text-image__wrap--mobile
//                │             [aria-hidden] d-block d-md-none   (mobile img)
//                │             └─ img.image-with-text-image__img
//                └─ .image-with-text__content          (order-2 order-md-0)
//                    ├─ div.section_block-…__iwt_heading      → <h2>
//                    ├─ div.section_block-…__iwt_description  → text
//                    ├─ div.shopify-block.bullets_block ×2
//                    │     └─ .bullet-point
//                    │         ├─ .bullet-point__icon > svg
//                    │         └─ .bullet-point__text
//                    └─ a.btn.btn-primary
//
// Two responsive breakpoints drive this section, both from Bootstrap:
//   • lg = 992px — `flex-lg-row` flips the stacked column into a row.
//   • md = 768px — `d-md-block` / `d-md-none` swap the mobile image for the
//     desktop image. Note this is NOT the same breakpoint as the layout flip.
//
// SELECTOR NOTE — heading vs description.
// The theme renders both through `snippets/text.liquid`, which emits only a
// per-block `section_block-<block.id>` class. There is no semantic
// `__heading` / `__description` hook, and the block-id suffix depends on the
// template's block keys. Rather than couple to those keys, the two are told
// apart structurally: the heading block is the one CONTAINING a heading
// element, the description block is the one that does not. The heading element
// itself is resolved by ARIA role in the page object (locator-priority rule 3),
// not by CSS.
// ─────────────────────────────────────────────────────────────

/** Heading elements a rich-text `heading` block may render (its `type_preset`). */
const HEADING_TAGS = 'h1, h2, h3, h4, h5, h6';

/** Text blocks rendered by `snippets/text.liquid` inside the content column. */
const TEXT_BLOCK = '.image-with-text__content [class*="section_block-"]';

export const imageWithTextSelectors = {
  // ── Region ────────────────────────────────────────────────
  sectionWrapper: '.shopify-section--image-with-text',
  section:        '.image-with-text',
  inner:          '.image-with-text__inner',
  media:          '.image-with-text__media',
  content:        '.image-with-text__content',

  // ── Image column ──────────────────────────────────────────
  imageBlock:       '.image-with-text-image',
  imageWraps:       '.image-with-text-image__wrap',
  // The desktop wrap is the one WITHOUT the --mobile modifier.
  desktopImageWrap: '.image-with-text-image__wrap:not(.image-with-text-image__wrap--mobile)',
  mobileImageWrap:  '.image-with-text-image__wrap--mobile',
  images:           '.image-with-text-image__img',
  // Rendered only when neither `image` nor `mobile_image` is set.
  placeholder:      '.image-with-text-image__placeholder',
  // Rendered only when `enable_overlay` is on.
  overlay:          '.image-with-text .gallery-card-overlay',

  // ── Content column ────────────────────────────────────────
  textBlocks:       TEXT_BLOCK,
  headingBlock:     `${TEXT_BLOCK}:has(${HEADING_TAGS})`,
  descriptionBlock: `${TEXT_BLOCK}:not(:has(${HEADING_TAGS}))`,

  bulletBlocks: '.image-with-text .shopify-block.bullets_block',
  bullets:      '.image-with-text .bullet-point',
  bulletIcons:  '.image-with-text .bullet-point__icon svg',
  bulletTexts:  '.image-with-text .bullet-point__text',

  button: '.image-with-text a.btn',
  // `blocks/button.liquid` renders role="link" aria-disabled="true" when the
  // block has a label but NO link. Used for a negative assertion.
  disabledButton: '.image-with-text a.btn[aria-disabled="true"]',
};

export default imageWithTextSelectors;
