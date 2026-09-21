import { test, expect } from '@playwright/test';

test.describe('Admin Authentication UX & Session Verification', () => {
  test('rejects login on invalid credentials with clear error alert', async ({ page }) => {
    await page.goto('/login');

    // Verify login form is displayed
    const emailInput = page.locator('#staff-email');
    const passwordInput = page.locator('#staff-password');
    const submitBtn = page.getByRole('button', { name: /تسجيل الدخول إلى لوحة الإدارة/ });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Fill invalid credentials
    await emailInput.fill('admin@saintsmaximos.org');
    await passwordInput.fill('InvalidPassword999!');
    await submitBtn.click();

    // Assert error alert is surfaced and user remains on /login
    const errorAlert = page.locator('div[class*="bg-red-50"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/بيانات الدخول غير صحيحة/);
    expect(page.url()).toContain('/login');
  });

  test('auto-dismisses sign-in notice and cleans URL reason param after 6s', async ({ page }) => {
    await page.goto('/login?reason=session');

    // Initial state: notice is visible
    const notice = page.locator('[data-signin-notice="session"]');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('انتهت جلسة الدخول');

    // Wait for auto-dismiss timer (6 seconds + margin)
    await page.waitForTimeout(6500);

    // Assert notice is dismissed and url query param stripped
    await expect(notice).toBeHidden();
    expect(page.url()).not.toContain('reason=session');
  });
});
