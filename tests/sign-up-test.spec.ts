// import { test, expect } from '@playwright/test';

// test('test', async ({ page }) => {
//     const timestamp = Date.now();
//     await page.goto('http://localhost:3000/sign-up');
//     await page.getByRole('textbox', { name: 'Email' }).click();
//     const date = new Date(timestamp);
//     const formattedTimestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
//     await page.getByRole('textbox', { name: 'Email' }).fill(`brad+${formattedTimestamp}@komandra.com`);
//     await page.getByRole('textbox', { name: 'Email' }).press('Tab');
//     await page.getByRole('textbox', { name: 'Password' }).fill('Testing123!');
//     await page.getByRole('button', { name: 'Sign up' }).click();
//     await page.waitForTimeout(8000);
//     await expect(page).toHaveURL('http://localhost:3000/onboarding');
// });

import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const formattedTimestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
    await page.goto('http://localhost:3000/sign-up');
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(`brad+${formattedTimestamp}@komandra.com`);
    await page.getByRole('textbox', { name: 'Email' }).press('Tab');
    await page.getByRole('textbox', { name: 'Password' }).fill('Testing123!');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await page.waitForTimeout(5000);

    // Onboarding Step 1: Profile & Privacy
    await expect(page).toHaveURL(/.*onboarding/);
    await page.getByLabel(/Tier 2: Controlled/i).check();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Onboarding Step 2: Account
    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Account Name' }).click();
    await page.getByRole('textbox', { name: 'Account Name' }).fill('Acme');
    await page.getByRole('button', { name: 'Create Account & Finish' }).click();
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(/.*dashboard/);
});