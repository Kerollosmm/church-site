import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../.scratch/phase6-gates/g6-screenshots');

test.describe('Public Videos Journey', () => {
  test('Journey: /about displays parish videos section with youtube-nocookie embed', async ({ page }) => {
    await page.goto('/about');

    // Section "فيديوهات الكنيسة"
    const sectionHeading = page.getByRole('heading', { name: 'فيديوهات الكنيسة' });
    await expect(sectionHeading).toBeVisible();

    // Video card with "صلوات عشية وتسبحة نصف الليل"
    const videoTitle = page.getByText('صلوات عشية وتسبحة نصف الليل');
    await expect(videoTitle).toBeVisible();

    // iframe element with youtube-nocookie embed URL
    const iframe = page.locator('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'e2e-videos-about.png'),
      fullPage: true,
    });
  });
});
