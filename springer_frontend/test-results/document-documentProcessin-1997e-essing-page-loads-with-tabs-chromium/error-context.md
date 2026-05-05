# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: document\documentProcessing.spec.ts >> Document Processing >> Document Processing page loads with tabs
- Location: e2e\document\documentProcessing.spec.ts:13:3

# Error details

```
Error: page.waitForURL: Test ended.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Test source

```ts
  1  | import { Page } from '@playwright/test';
  2  | 
  3  | export const USERS = {
  4  |   taRecruiter: { email: 'mozhi@kanini.com',   password: 'password123' },
  5  |   taHead:      { email: 'sudha@kanini.com',   password: 'password123' },
  6  |   tc:          { email: 'lavanya@kanini.com', password: 'password123' },
  7  | };
  8  | 
  9  | export async function login(page: Page, email: string, password: string) {
  10 |   await page.goto('/login');
  11 |   // Wait for the email input to appear — avoids networkidle issue with WebSockets
  12 |   await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 15000 });
  13 |   await page.locator('input[name="email"]').fill(email);
  14 |   await page.locator('input[name="password"]').fill(password);
  15 |   await page.getByRole('button', { name: 'Login' }).click();
> 16 |   await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
     |              ^ Error: page.waitForURL: Test ended.
  17 | }
  18 | 
  19 | export async function loginAsRecruiter(page: Page) {
  20 |   await login(page, USERS.taRecruiter.email, USERS.taRecruiter.password);
  21 | }
  22 | 
  23 | export async function loginAsTC(page: Page) {
  24 |   await login(page, USERS.tc.email, USERS.tc.password);
  25 | }
  26 | 
  27 | export async function loginAsHead(page: Page) {
  28 |   await login(page, USERS.taHead.email, USERS.taHead.password);
  29 | }
  30 | 
```