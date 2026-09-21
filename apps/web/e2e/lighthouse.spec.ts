import { test, expect } from '@playwright/test';

test.describe('Performance Budget & Load Benchmarks', () => {
  test('Home page load duration is under 1200ms budget', async ({ page, request }) => {
    // Warm up
    await request.get('/');

    const startTime = Date.now();
    const res = await request.get('/');
    const duration = Date.now() - startTime;

    expect(res.status()).toBe(200);
    expect(duration).toBeLessThan(1200);

    // Verify page renders cleanly in browser
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('Masses schedule page load duration is under 1200ms budget', async ({ page, request }) => {
    // Warm up
    await request.get('/masses');

    const startTime = Date.now();
    const res = await request.get('/masses');
    const duration = Date.now() - startTime;

    expect(res.status()).toBe(200);
    expect(duration).toBeLessThan(1200);

    await page.goto('/masses', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('Health endpoint responds with status ok in under 500ms', async ({ request }) => {
    // Warm up endpoint
    await request.get('/api/health');

    const startTime = Date.now();
    const res = await request.get('/api/health');
    const duration = Date.now() - startTime;

    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.app).toBe('web');
    expect(duration).toBeLessThan(500);
  });
});
