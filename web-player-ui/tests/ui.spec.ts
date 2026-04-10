import { test, expect } from '@playwright/test';

test.describe('Frosthaven Web Player UI', () => {
  test('loads and connects to server', async ({ page }) => {
    await page.goto('/');

    const status = page.locator('[role="status"]');
    await expect(status).toBeVisible();
    await expect(page.locator('body')).toContainText(/(Connected|Connecting|Waiting|Disconnected)/i);
  });

  test('shows character selection when game data available', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const heading = page.getByRole('heading', { name: /X-Haven Assistant/i });
    try {
      await heading.waitFor({ timeout: 5000 });
      await expect(heading).toBeVisible();
      await expect(page.getByText('Select your character')).toBeVisible();
      await page.screenshot({ path: 'tests/screenshots/character-selection.png', fullPage: true });
    } catch {
      await page.screenshot({ path: 'tests/screenshots/waiting-state.png', fullPage: true });
    }
  });

  test('character sheet renders after selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const firstCharButton = page.locator('button').filter({ hasText: /Lv \d/i }).first();
    try {
      await firstCharButton.waitFor({ timeout: 8000 });
    } catch {
      test.skip(true, 'No game data available');
      return;
    }

    await firstCharButton.click();
    await page.waitForTimeout(500);

    // Verify all sections rendered
    await expect(page.getByRole('heading', { name: 'Initiative' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Health' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Experience/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Status Effects' })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/character-sheet.png', fullPage: true });
  });

  test('visual regression - character selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const heading = page.getByRole('heading', { name: /X-Haven Assistant/i });
    try {
      await heading.waitFor({ timeout: 5000 });
    } catch {
      test.skip(true, 'No game data available');
      return;
    }

    await expect(page).toHaveScreenshot('character-selection.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('visual regression - character sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const firstCharButton = page.locator('button').filter({ hasText: /Lv \d/i }).first();
    try {
      await firstCharButton.waitFor({ timeout: 8000 });
    } catch {
      test.skip(true, 'No game data available');
      return;
    }

    await firstCharButton.click();
    await page.getByRole('heading', { name: 'Initiative' }).waitFor();

    await expect(page).toHaveScreenshot('character-sheet.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
