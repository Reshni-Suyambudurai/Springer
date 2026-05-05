import { test, expect } from '@playwright/test';

// Note: Intern login requires an activated intern account (user linked to a candidate)
// These tests use a pre-activated intern account
const INTERN_EMAIL = 'intern.test@kanini.com';
const INTERN_PASSWORD = 'password';

test.describe('Intern Portal', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(INTERN_EMAIL);
    await page.getByLabel('Password').fill(INTERN_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    // If login fails (no intern account), skip gracefully
    await page.waitForTimeout(2000);
  });

  test('Intern dashboard loads with overview', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip(true, 'No intern account available — activate an intern first');
    }
    await expect(page.getByText(/overview/i)).toBeVisible();
    await expect(page.getByText(/attendance/i)).toBeVisible();
  });

  test('My Scores page loads', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip(true, 'No intern account available');
    }
    await page.getByRole('link', { name: /my scores/i }).click();
    await page.waitForURL(/scores/);
    await expect(page.getByText(/my scores/i)).toBeVisible();
    await expect(page.getByText(/batch comparison/i)).toBeVisible();
    await expect(page.getByText(/leaderboard/i)).toBeVisible();
  });

  test('Leave page loads', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip(true, 'No intern account available');
    }
    await page.getByRole('link', { name: /leave/i }).click();
    await page.waitForURL(/leave/);
    await expect(page.getByText(/leave/i)).toBeVisible();
  });

  test('Warnings page loads', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip(true, 'No intern account available');
    }
    await page.getByRole('link', { name: /warnings|notices/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/warnings|notices/i)).toBeVisible();
  });

  test('Certificates page loads', async ({ page }) => {
    if (page.url().includes('/login')) {
      test.skip(true, 'No intern account available');
    }
    await page.getByRole('link', { name: /certificates/i }).click();
    await page.waitForURL(/certificates/);
    await expect(page.getByText(/certificates/i)).toBeVisible();
  });

});
