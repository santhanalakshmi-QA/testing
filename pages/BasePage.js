// pages/BasePage.js
// ─────────────────────────────────────────────────────────────
// Base class for all page objects.
// Every page (HomePage, ProductPage, CartPage etc.)
// extends this class and inherits these shared methods.
// ─────────────────────────────────────────────────────────────

import LOCATORS from '../locators/shopify-locators.js';

export class BasePage {

  constructor(page) {
    this.page     = page;
    this.locators = LOCATORS;
    // Trailing slash stripped so `baseURL + '/path'` never yields `//path`.
    this.baseURL  = (process.env.SHOPIFY_BASE_URL || 'https://lollipop-theme.myshopify.com').replace(/\/+$/, '');
  }

  // ── Navigation ──────────────────────────────────────────────

  // Go to any path on the site
  async goto(path = '/') {
    await this.page.goto(this.baseURL + path, {
      waitUntil: 'domcontentloaded',
    });
  }

  // Go to home page
  async gotoHome() {
    await this.goto('/');
  }

  // Go to collections page
  async gotoCollections() {
    await this.goto('/collections/all');
  }

  // Go to cart page
  async gotoCart() {
    await this.goto('/cart');
  }

  // Go to contact page
  async gotoContact() {
    await this.goto('/pages/contact');
  }

  // Go to blog page
  async gotoBlog() {
    await this.goto('/blogs/news');
  }

  // Go to login page
  async gotoLogin() {
    await this.goto('/account/login');
  }

  // ── Waiting helpers ─────────────────────────────────────────

  // Wait for an element to be visible
  async waitForElement(selector, timeout = 10000) {
    await this.page.locator(selector).first().waitFor({
      state: 'visible',
      timeout,
    });
  }

  // Wait for page to fully load
  async waitForPageLoad() {
    await this.page.waitForLoadState('load');
  }

  // ── Element checks ──────────────────────────────────────────

  // Check if element is visible — returns true or false
  async isVisible(selector) {
    try {
      return await this.page.locator(selector).first().isVisible();
    } catch {
      return false;
    }
  }

  // Get text content of an element
  async getText(selector) {
    return await this.page.locator(selector).first().innerText();
  }

  // Get attribute value of an element
  async getAttribute(selector, attribute) {
    return await this.page.locator(selector).first().getAttribute(attribute);
  }

  // ── Actions ─────────────────────────────────────────────────

  // Click an element
  async click(selector) {
    await this.page.locator(selector).first().click();
  }

  // Fill an input field
  async fill(selector, value) {
    await this.page.locator(selector).first().fill(value);
  }

  // Press a keyboard key
  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  // Scroll down by pixels
  async scrollDown(pixels = 500) {
    await this.page.evaluate((px) => window.scrollBy(0, px), pixels);
    await this.page.waitForTimeout(300);
  }

  // Scroll to bottom of page
  async scrollToBottom() {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await this.page.waitForTimeout(500);
  }

  // Hover over an element
  async hover(selector) {
    await this.page.locator(selector).first().hover();
  }

  // ── Viewport helpers ────────────────────────────────────────

  // Set viewport to mobile size (375px)
  async setMobileView() {
    await this.page.setViewportSize({ width: 375, height: 812 });
  }

  // Set viewport to tablet size (768px)
  async setTabletView() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  // Set viewport to desktop size (1440px)
  async setDesktopView() {
    await this.page.setViewportSize({ width: 1440, height: 900 });
  }

  // ── Screenshot helpers ──────────────────────────────────────

  // Take a full page screenshot
  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }

  // ── Header actions ──────────────────────────────────────────

  // Click the cart icon in header
  async clickCartIcon() {
    await this.click(this.locators.header.cartIcon);
  }

  // Click search icon in header
  async clickSearchIcon() {
    await this.click(this.locators.header.searchIcon);
  }

  // Click hamburger menu (mobile)
  async clickMobileMenu() {
    await this.click(this.locators.header.menuButton);
    await this.page.waitForTimeout(400);
  }

  // Click logo to go home
  async clickLogo() {
    await this.click(this.locators.header.logo);
    await this.waitForPageLoad();
  }

  // ── Console error checker ───────────────────────────────────

  // Collect all JS errors on a page
  // Call this before page.goto() to capture errors
  collectConsoleErrors() {
    const errors = [];
    this.page.on('pageerror', (err) => errors.push(err.message));
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    return errors;
  }

  // ── URL helper ───────────────────────────────────────────────

  // Get current page URL
  getCurrentURL() {
    return this.page.url();
  }

  // Get current page title
  async getPageTitle() {
    return await this.page.title();
  }

}
