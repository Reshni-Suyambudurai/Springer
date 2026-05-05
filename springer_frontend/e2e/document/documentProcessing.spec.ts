import { test, expect } from '@playwright/test';
import { loginAsRecruiter } from '../helpers/auth.helper';

test.describe('Document Processing', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsRecruiter(page);
    // Navigate to Document Processing
    await page.getByRole('link', { name: /documents processing/i }).click();
    await page.waitForURL(/documents/);
  });

  test('Document Processing page loads with tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /send documents/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /verify documents/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /offers/i })).toBeVisible();
  });

  test('Send Documents tab shows candidates', async ({ page }) => {
    await page.getByRole('tab', { name: /send documents/i }).click();
    // Cycle selector should be visible
    await expect(page.getByText(/2026/)).toBeVisible();
    // Candidates table should load
    await page.waitForSelector('table', { timeout: 8000 });
    await expect(page.locator('table')).toBeVisible();
  });

  test('Send Documents tab has search and filter', async ({ page }) => {
    await page.getByRole('tab', { name: /send documents/i }).click();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('Verify Documents tab loads', async ({ page }) => {
    await page.getByRole('tab', { name: /verify documents/i }).click();
    await page.waitForTimeout(1000);
    // Should show either documents or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no documents/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('Offers tab loads', async ({ page }) => {
    await page.getByRole('tab', { name: /offers/i }).click();
    await page.waitForTimeout(1000);
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no offer/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

});
