// locators/announcement-bar.locators.ts
// ─────────────────────────────────────────────────────────────
// CSS selectors for the Announcement Bar of the CURRENT published
// Shopify theme: "theme-export-wdt-atles-myshopify-com-kajalsele"
// (a Selena / SHThemes build) on wdtsanthanalakshmi.myshopify.com.
//
// Verified against the LIVE rendered DOM (not the Liquid source) via the
// Shopify MCP server + a storefront DOM dump. The section id is dynamic
// (#shopify-section-sections--27421694296431__announcement_bar) so it is
// NEVER hard-coded; everything hangs off stable theme class hooks:
//
//   section.shopify-section.shopify-section-group-header-group
//                          .shopify-section--announcement-bar   (wrapper)
//     └─ .announcement-bar.color-scheme-1.announcement-bar--divider
//        │  [data-section-id] [data-type="marquee"]
//        └─ .full-width                       (layout-width wrapper)
//            └─ .announcement-bar__inner
//                └─ .announcement-bar__content
//                    └─ .announcement-bar__marquee  [data-pause-hover="true"]
//                        └─ .announcement-bar__marquee-track   (CSS animation)
//                            └─ .announcement-bar__marquee-group
//                                └─ div.shopify-block            ×3
//                                    └─ .announcement-bar-item
//                                        ├─ .announcement-bar-item__text
//                                        └─ a.announcement-bar-item__link (optional)
//
// The theme ALSO ships a carousel (Swiper) mode for this section, plus optional
// social-icon and localization slots. This store runs marquee mode with both
// slots disabled, so those selectors exist only for negative assertions.
// ─────────────────────────────────────────────────────────────

export const announcementBarSelectors = {
  // ── Region ────────────────────────────────────────────────
  sectionWrapper: '.shopify-section--announcement-bar',
  section:        '.announcement-bar',
  divider:        '.announcement-bar--divider',
  inner:          '.announcement-bar__inner',
  content:        '.announcement-bar__content',

  // ── Marquee (the mode this store runs) ────────────────────
  marquee:        '.announcement-bar__marquee',
  track:          '.announcement-bar__marquee-track',
  group:          '.announcement-bar__marquee-group',

  // ── Announcement items / messages ─────────────────────────
  item:           '.announcement-bar .announcement-bar-item',
  itemText:       '.announcement-bar .announcement-bar-item__text',
  itemLink:       '.announcement-bar a.announcement-bar-item__link',

  // Relative selectors (used from within a resolved container locator).
  itemRel:        '.announcement-bar-item',
  itemTextRel:    '.announcement-bar-item__text',
  itemLinkRel:    'a.announcement-bar-item__link',

  // ── Modes / slots this store config does NOT render ────────
  // Kept for negative assertions.
  swiper:         '.announcement-bar__swiper',
  swiperSlide:    '.announcement-bar__track .swiper-slide',
  navButtons:     '.announcement-bar .swiper-button-next, .announcement-bar .swiper-button-prev',
  social:         '.announcement-bar__social',
  localization:   '.announcement-bar__localization',
  edgeFade:       '.announcement-bar .marquee-content--edge',
  // The bar is persistent — the theme renders no dismiss/close affordance.
  closeButton:    '.announcement-bar [class*="close"], .announcement-bar button[aria-label*="close" i], .announcement-bar button[aria-label*="dismiss" i]',

  // ── Neighbouring region ───────────────────────────────────
  // This theme's header is a <site-header> custom element. Used by the
  // "bar sits above the header" check. When a dedicated HeaderPage is written
  // for this theme, move this selector into its own header locator module.
  siteHeader:     'site-header',

  // ── Hooks the theme's own marquee.js looks for ─────────────
  // assets/marquee.js queries .marquee-content / .marquee-track / .marquee-group,
  // but this section emits .announcement-bar__marquee{,-track,-group}. The names
  // never match, so the clone-builder never runs on the announcement bar.
  // Asserted negatively in the spec to pin the defect. See NOTE 1 in the spec.
  jsMarqueeContent: '.announcement-bar .marquee-content',
  jsMarqueeTrack:   '.announcement-bar .marquee-track',
  jsMarqueeGroup:   '.announcement-bar .marquee-group',
};

export default announcementBarSelectors;
