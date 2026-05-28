import { test, expect } from '@playwright/test';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin for test setup/cleanup
if (!getApps().length) {
    initializeApp({
        projectId: 'komandra-app06',
    });
}

const db = getFirestore();

test.describe('Teampulp Product Lifecycle', () => {
    
    test('Owner signs up, creates account, and invites members', async ({ page }) => {
        const timestamp = Date.now();
        const email = `owner+${timestamp}@teampulp.com`;

        // 1. Sign Up
        await page.goto('http://localhost:3000/sign-up');
        await page.getByRole('textbox', { name: 'Email' }).fill(email);
        await page.getByRole('textbox', { name: 'Password' }).fill('Testing123!');
        await page.getByRole('button', { name: 'Sign up' }).click();

        // 2. Onboarding
        await expect(page).toHaveURL(/.*onboarding/, { timeout: 10000 });
        await page.getByLabel(/Tier 1: Standard/i).check();
        await page.getByRole('button', { name: 'Continue' }).click();
        
        await page.getByRole('textbox', { name: 'Account Name' }).fill(`Lifecycle Corp ${timestamp}`);
        await page.getByRole('button', { name: 'Create Account & Finish' }).click();

        // 3. Invite Members
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
        await page.goto('http://localhost:3000/teams');
        
        // Invite 4 users
        const members = ['John', 'Sarah', 'Alice', 'Bob'];
        for (const name of members) {
            await page.getByRole('button', { name: /Invite Member/i }).click();
            await page.getByRole('textbox', { name: /Email/i }).last().fill(`${name.toLowerCase()}+${timestamp}@teampulp.com`);
            await page.getByRole('textbox', { name: /Name/i }).last().fill(name);
            await page.getByRole('button', { name: /Send Invitation/i }).click();
            await page.waitForTimeout(1000);
        }

        // Verify invitations are in the list
        for (const name of members) {
            await expect(page.locator('table')).toContainText(`${name.toLowerCase()}+${timestamp}@teampulp.com`);
        }
    });

    test('Simulate Connection Completion', async ({ page }) => {
        // This test assumes an existing connection or we seed one
        // For exploration, let's just navigate to a connection page if we had an ID
        // Since we don't have a live connection easily, we'll stop here for now
        // and propose a simulation helper.
    });
});
