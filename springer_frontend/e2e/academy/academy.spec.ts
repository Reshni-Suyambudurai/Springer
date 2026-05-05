import { test, expect } from '@playwright/test';
import { loginAsTC } from '../helpers/auth.helper';

test.describe('Academy - Training Coordinator', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTC(page);
    await page.getByRole('link', { name: /academy/i }).click();
    await page.waitForURL(/academy/);
  });

  test('Academy page loads with tab groups', async ({ page }) => {
    await expect(page.getByText(/program setup/i)).toBeVisible();
    await expect(page.getByText(/training/i)).toBeVisible();
    await expect(page.getByText(/management/i)).toBeVisible();
  });

  test('Year filter is visible and has current year', async ({ page }) => {
    const currentYear = new Date().getFullYear().toString();
    await expect(page.getByText(currentYear)).toBeVisible();
  });

  test('Programs tab loads', async ({ page }) => {
    await page.getByText(/program setup/i).click();
    await page.getByRole('button', { name: /programs/i }).click();
    await page.waitForTimeout(1000);
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no programs/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('Attendance tab loads', async ({ page }) => {
    await page.getByText(/training/i).first().click();
    await page.getByRole('button', { name: /attendance/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/program/i)).toBeVisible();
  });

  test('Scores tab loads', async ({ page }) => {
    await page.getByText(/training/i).first().click();
    await page.getByRole('button', { name: /scores/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/program/i)).toBeVisible();
  });

  test('Candidate Progress tab loads', async ({ page }) => {
    await page.getByText(/training/i).first().click();
    await page.getByRole('button', { name: /candidate progress/i }).click();
    await page.waitForTimeout(1000);
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no candidates/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('Warnings tab loads with filters', async ({ page }) => {
    await page.getByText(/management/i).click();
    await page.getByRole('button', { name: /disciplinary/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/all programs/i)).toBeVisible();
    await expect(page.getByText(/all status/i)).toBeVisible();
  });

  test('Leave Requests tab loads with filters', async ({ page }) => {
    await page.getByText(/management/i).click();
    await page.getByRole('button', { name: /leave requests/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/all programs/i)).toBeVisible();
  });

});
