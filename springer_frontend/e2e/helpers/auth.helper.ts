import { Page } from '@playwright/test';

export const USERS = {
  taRecruiter: { email: 'mozhi@kanini.com',   password: 'password123' },
  taHead:      { email: 'sudha@kanini.com',   password: 'password123' },
  tc:          { email: 'lavanya@kanini.com', password: 'password123' },
};

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  // Wait for the email input to appear — avoids networkidle issue with WebSockets
  await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
}

export async function loginAsRecruiter(page: Page) {
  await login(page, USERS.taRecruiter.email, USERS.taRecruiter.password);
}

export async function loginAsTC(page: Page) {
  await login(page, USERS.tc.email, USERS.tc.password);
}

export async function loginAsHead(page: Page) {
  await login(page, USERS.taHead.email, USERS.taHead.password);
}
