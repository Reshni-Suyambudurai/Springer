# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: intern\intern.spec.ts >> Intern Portal >> Intern dashboard loads with overview
- Location: e2e\intern\intern.spec.ts:19:3

# Error details

```
Error: locator.fill: Error: strict mode violation: getByLabel('Password') resolved to 2 elements:
    1) <input value="" id="_r_2_" type="password" name="password" aria-invalid="false" autocomplete="current-password" class="MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd css-1dune0f-MuiInputBase-input-MuiOutlinedInput-input"/> aka getByRole('textbox', { name: 'Password' })
    2) <button tabindex="0" type="button" aria-label="Show password" class="MuiButtonBase-root MuiIconButton-root MuiIconButton-edgeEnd MuiIconButton-sizeMedium login-eye-btn css-1ysp02-MuiButtonBase-root-MuiIconButton-root">…</button> aka getByRole('button', { name: 'Show password' })

Call log:
  - waiting for getByLabel('Password')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - heading "Welcome back" [level=4] [ref=e7]
    - paragraph [ref=e8]: Login to S-TAMS
  - generic [ref=e9]:
    - generic [ref=e11]:
      - generic [ref=e12]: Email
      - generic [ref=e13]:
        - textbox "Email" [active] [ref=e14]: intern.test@kanini.com
        - group:
          - generic: Email
    - generic [ref=e16]:
      - generic: Password
      - generic [ref=e17]:
        - textbox "Password" [ref=e18]
        - button "Show password" [ref=e20] [cursor=pointer]:
          - generic [ref=e21]: show
        - group:
          - generic: Password
    - button "Login" [ref=e22] [cursor=pointer]
    - generic [ref=e23]: Talent Acquisition Management System
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Note: Intern login requires an activated intern account (user linked to a candidate)
  4  | // These tests use a pre-activated intern account
  5  | const INTERN_EMAIL = 'intern.test@kanini.com';
  6  | const INTERN_PASSWORD = 'password';
  7  | 
  8  | test.describe('Intern Portal', () => {
  9  | 
  10 |   test.beforeEach(async ({ page }) => {
  11 |     await page.goto('/login');
  12 |     await page.getByLabel('Email').fill(INTERN_EMAIL);
> 13 |     await page.getByLabel('Password').fill(INTERN_PASSWORD);
     |                                       ^ Error: locator.fill: Error: strict mode violation: getByLabel('Password') resolved to 2 elements:
  14 |     await page.getByRole('button', { name: 'Login' }).click();
  15 |     // If login fails (no intern account), skip gracefully
  16 |     await page.waitForTimeout(2000);
  17 |   });
  18 | 
  19 |   test('Intern dashboard loads with overview', async ({ page }) => {
  20 |     if (page.url().includes('/login')) {
  21 |       test.skip(true, 'No intern account available — activate an intern first');
  22 |     }
  23 |     await expect(page.getByText(/overview/i)).toBeVisible();
  24 |     await expect(page.getByText(/attendance/i)).toBeVisible();
  25 |   });
  26 | 
  27 |   test('My Scores page loads', async ({ page }) => {
  28 |     if (page.url().includes('/login')) {
  29 |       test.skip(true, 'No intern account available');
  30 |     }
  31 |     await page.getByRole('link', { name: /my scores/i }).click();
  32 |     await page.waitForURL(/scores/);
  33 |     await expect(page.getByText(/my scores/i)).toBeVisible();
  34 |     await expect(page.getByText(/batch comparison/i)).toBeVisible();
  35 |     await expect(page.getByText(/leaderboard/i)).toBeVisible();
  36 |   });
  37 | 
  38 |   test('Leave page loads', async ({ page }) => {
  39 |     if (page.url().includes('/login')) {
  40 |       test.skip(true, 'No intern account available');
  41 |     }
  42 |     await page.getByRole('link', { name: /leave/i }).click();
  43 |     await page.waitForURL(/leave/);
  44 |     await expect(page.getByText(/leave/i)).toBeVisible();
  45 |   });
  46 | 
  47 |   test('Warnings page loads', async ({ page }) => {
  48 |     if (page.url().includes('/login')) {
  49 |       test.skip(true, 'No intern account available');
  50 |     }
  51 |     await page.getByRole('link', { name: /warnings|notices/i }).click();
  52 |     await page.waitForTimeout(1000);
  53 |     await expect(page.getByText(/warnings|notices/i)).toBeVisible();
  54 |   });
  55 | 
  56 |   test('Certificates page loads', async ({ page }) => {
  57 |     if (page.url().includes('/login')) {
  58 |       test.skip(true, 'No intern account available');
  59 |     }
  60 |     await page.getByRole('link', { name: /certificates/i }).click();
  61 |     await page.waitForURL(/certificates/);
  62 |     await expect(page.getByText(/certificates/i)).toBeVisible();
  63 |   });
  64 | 
  65 | });
  66 | 
```