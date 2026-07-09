// locators/announcement-bar.locators.ts
// ─────────────────────────────────────────────────────────────
// CSS selectors for the Lollipop Shopify theme storefront
// Announcement Bar (the scrolling strip pinned above the header).
//
// Verified against the LIVE DOM of https://lollipop-theme.myshopify.com/
// (not assumptions). The section id is dynamic
// (#shopify-section-…__announcement_bar_NM8agT) so it is NEVER hard-coded;
// everything is scoped under the stable `.announcement-bar-section` hook:
//
//   .shopify-section.announcement            (section wrapper, above header)
//     └─ .announcement-bar-section (+ color-scheme-* gradient)
//         └─ .container
//             └─ .announcement-bar            (flex row)
//                 └─ .announcement_bar_style-horizontal   (marquee mode)
//                     └─ .overflow-hidden.text-nowrap     (clipping viewport)
//                         ├─ .marquee_annoucement                 (active track)
//                         │    └─ [data-block-type="announcement"] > p  ×5
//                         └─ .marquee_annoucement[inert]          (duplicate
//                              track for the seamless loop, hidden from a11y)
//
// NOTE: `.marquee_annoucement` is ALSO used by the home-page wave-marquee
// section (locators/shopify-locators.js → waveMarquee), so all track/block
// selectors are deliberately scoped under `.announcement-bar-section`.
// ─────────────────────────────────────────────────────────────

export const announcementBarSelectors = {
  // ── Region ────────────────────────────────────────────────
  sectionWrapper: '.shopify-section.announcement',
  section:        '.announcement-bar-section',
  container:      '.announcement-bar-section .container',
  bar:            '.announcement-bar-section .announcement-bar',
  horizontal:     '.announcement-bar-section .announcement_bar_style-horizontal',
  viewport:       '.announcement-bar-section .overflow-hidden.text-nowrap',

  // ── Marquee tracks ────────────────────────────────────────
  track:          '.announcement-bar-section .marquee_annoucement',
  activeTrack:    '.announcement-bar-section .marquee_annoucement:not([inert])',
  duplicateTrack: '.announcement-bar-section .marquee_annoucement[inert]',

  // ── Announcement blocks / messages ────────────────────────
  block:          '.announcement-bar-section [data-block-type="announcement"]',
  message:        '.announcement-bar-section [data-block-type="announcement"] p',

  // Relative selectors (used from within a resolved track locator).
  blockRel:       '[data-block-type="announcement"]',
  messageRel:     '[data-block-type="announcement"] p',

  // ── Controls that this theme config does NOT render ────────
  // Kept for negative assertions (the bar is persistent — no dismiss).
  closeButton:    '.announcement-bar-section [class*="close"], .announcement-bar-section button[aria-label*="close" i], .announcement-bar-section button[aria-label*="dismiss" i]',
  // Vertical/swiper mode is not active in this config (horizontal marquee).
  swiper:         '.announcement-bar-section .swiper-container',
};

export default announcementBarSelectors;
