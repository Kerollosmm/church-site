import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../.scratch/phase6-gates/g6-screenshots');

test.describe('Public Dynamic Content Journeys', () => {
  test('Journey 1: /content/article listing displays articles with RTL layout', async ({ page }) => {
    await page.goto('/content/article');

    // Verify RTL document layout
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Verify content type heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText('مقالات وأخبار');

    // Verify article card
    await expect(page.getByText('كنوز الآباء الأرثوذكسية')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'e2e-content-list.png'),
      fullPage: true,
    });
  });

  test('Journey 2: /content/article/orthodox-patristic-treasures detail displays article content with RTL layout', async ({ page }) => {
    await page.goto('/content/article/orthodox-patristic-treasures');

    // Verify RTL layout
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Verify article title
    await expect(page.getByRole('article').getByRole('heading', { name: 'كنوز الآباء الأرثوذكسية' })).toBeVisible();

    // Verify article body text
    await expect(page.getByText('نصوص ورسائل روحية أصيلة من التراث الآبائي العريق لكنيستنا المجيدة.')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'e2e-content-detail.png'),
      fullPage: true,
    });
  });

  test('Journey 3: /content/sermon empty type shows honest empty state message', async ({ page }) => {
    await page.goto('/content/sermon');

    // Verify empty state heading and text
    const emptyHeading = page.getByRole('heading', { name: 'لا توجد عناصر منشورة حالياً' });
    await expect(emptyHeading).toBeVisible();

    const emptyDesc = page.getByText(/لم يتم نشر أي محتوى ضمن قسم «عظات وكلمات روحية» حتى الآن/);
    await expect(emptyDesc).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'e2e-empty-state.png'),
      fullPage: true,
    });
  });
});
