import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../.scratch/phase7-gates/g6-screens');

const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '768', width: 768, height: 1024 },
  { label: '390', width: 390, height: 844 },
] as const;

test.describe('Modernized After Screenshots', () => {
  for (const vp of VIEWPORTS) {
    test(`Capture home at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `after-home-${vp.label}.png`),
        fullPage: true,
      });
    });

    test(`Capture about at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/about', { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `after-about-${vp.label}.png`),
        fullPage: true,
      });
    });

    test(`Capture services at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/services', { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `after-services-${vp.label}.png`),
        fullPage: true,
      });
    });

    test(`Capture content at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/content/article/orthodox-patristic-treasures', { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `after-content-${vp.label}.png`),
        fullPage: true,
      });
    });

    test(`Capture admin dashboard at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `after-admin-dashboard-${vp.label}.png`),
        fullPage: true,
      });
    });

    test(`Capture admin videos at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:3001/videos', { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `after-admin-videos-${vp.label}.png`),
        fullPage: true,
      });
    });
  }

  test('Capture mobile nav drawer open state at 390', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const menuButton = page.locator('button[aria-label="فتح القائمة"]');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const closeButton = page.locator('button[aria-label="إغلاق القائمة"]');
    await expect(closeButton).toBeVisible();

    // Wait a brief moment for layout render
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'after-nav-drawer-390.png'),
      fullPage: true,
    });
  });
});
