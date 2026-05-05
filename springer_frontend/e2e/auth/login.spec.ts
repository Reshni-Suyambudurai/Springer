import { test, expect } from '@playwright/test';
import { loginAsRecruiter, loginAsTC, loginAsHead } from '../helpers/auth.helper';

test.describe('Login', () => {

  test('TA Recruiter can login and sees recruiter dashboard', async ({ page }) => {
    await loginAsRecruiter(page);
    await expect(page).toHaveURL(/recruiter/);
    await expect(page.getByText('TA_RECRUITER')).toBeVisible();
  });

  test('Training Coordinator can login and sees TC dashboard', async ({ page }) => {
    await loginAsTC(page);
    await expect(page).toHaveURL(/training-coordinator/);
    await expect(page.getByText('TRAINING_COORDINATOR')).toBeVisible();
  });

  test('TA Head can login and sees head dashboard', async ({ page }) => {
    await loginAsHead(page);
    await expect(page).toHaveURL(/ta-head/);
    await expect(page.getByText('TA_HEAD')).toBeVisible();
  });

  test('Invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('input[name="email"]').fill('wrong@kanini.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

});
