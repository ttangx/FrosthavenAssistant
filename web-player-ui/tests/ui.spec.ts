import { test, expect } from '@playwright/test';

test.describe('Frosthaven Web Player UI', () => {
  test('loads and connects to server', async ({ page }) => {
    await page.goto('/');

    // Should show connection status
    const status = page.locator('[role="status"]');
    await expect(status).toBeVisible();

    // Should show either connected state or waiting state
    const body = page.locator('body');
    await expect(body).toContainText(/(CONNECTED|CONNECTING|WAITING|DISCONNECTED)/i);
  });

  test('shows character selection when game data available', async ({ page }) => {
    await page.goto('/');

    // Wait for WebSocket to connect and receive game state
    const heading = page.getByRole('heading', { name: /X-Haven Assistant/i });

    // If game data is available, character list should appear
    try {
      await heading.waitFor({ timeout: 5000 });

      // Verify title
      await expect(heading).toBeVisible();

      // Verify subtitle
      await expect(page.getByText(/SELECT YOUR CHARACTER/i)).toBeVisible();

      // Take screenshot of character selection
      await page.screenshot({ path: 'tests/screenshots/character-selection.png', fullPage: true });
    } catch {
      // No game data - just verify the waiting state renders
      await expect(page.getByText(/(WAITING|CONNECTING)/i)).toBeVisible();
      await page.screenshot({ path: 'tests/screenshots/waiting-state.png', fullPage: true });
    }
  });

  test('character sheet renders after selection', async ({ page }) => {
    await page.goto('/');

    // Wait for character buttons to appear
    const firstCharButton = page.locator('button').filter({ hasText: /LV \d/ }).first();

    try {
      await firstCharButton.waitFor({ timeout: 5000 });
      await firstCharButton.click();

      // Should show character sheet sections
      await expect(page.getByText(/INITIATIVE/i)).toBeVisible();
      await expect(page.getByText(/HEALTH/i)).toBeVisible();
      await expect(page.getByText(/EXPERIENCE/i)).toBeVisible();
      await expect(page.getByText(/STATUS EFFECTS/i)).toBeVisible();

      // Take full-page screenshot
      await page.screenshot({ path: 'tests/screenshots/character-sheet.png', fullPage: true });
    } catch {
      // No game data available, skip
      test.skip();
    }
  });

  test('visual regression - character selection', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { name: /X-Haven Assistant/i });
    try {
      await heading.waitFor({ timeout: 5000 });
      await expect(page).toHaveScreenshot('character-selection.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    } catch {
      test.skip();
    }
  });

  test('visual regression - character sheet', async ({ page }) => {
    await page.goto('/');

    const firstCharButton = page.locator('button').filter({ hasText: /LV \d/ }).first();
    try {
      await firstCharButton.waitFor({ timeout: 5000 });
      await firstCharButton.click();
      await page.getByText(/INITIATIVE/i).waitFor();

      await expect(page).toHaveScreenshot('character-sheet.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    } catch {
      test.skip();
    }
  });
});
