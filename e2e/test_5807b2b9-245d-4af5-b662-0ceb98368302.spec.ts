
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('Test_2025-06-26', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3000');

    // Navigate to URL
    await page.goto('http://localhost:3000');

    // Navigate to URL
    await page.goto('http://localhost:3000/debug/posthog');

    // Navigate to URL
    await page.goto('http://localhost:3000/debug/posthog');

    // Click element
    await page.click('button:text("Accept All")');

    // Navigate to URL
    await page.goto('http://localhost:3000/');
});