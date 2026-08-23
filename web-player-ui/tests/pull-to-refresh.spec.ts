import { expect, test, type Page } from '@playwright/test';

test.use({
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

async function dragFromTop(page: Page, endY: number) {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 195, y: 8 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 195, y: endY }],
  });

  return async () => {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await client.detach();
  };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const loads = Number(sessionStorage.getItem('test-loads') ?? '0');
    sessionStorage.setItem('test-loads', String(loads + 1));
  });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 0));
});

test('a short pull settles without refreshing', async ({ page }) => {
  const release = await dragFromTop(page, 44);
  await expect(page.getByRole('status', { name: 'Pull to refresh' })).toBeVisible();
  await release();

  await expect(page.getByRole('status', { name: 'Pull to refresh' })).toBeHidden();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('test-loads')))
    .toBe('1');
});

test('releasing beyond the threshold refreshes the SPA', async ({ page }) => {
  const release = await dragFromTop(page, 96);
  await expect(page.getByRole('status', { name: 'Release to refresh' })).toBeVisible();
  await release();

  await expect(page.getByRole('status', { name: 'Refreshing' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('test-loads')))
    .toBe('2');
});

test('adding a second finger cancels a ready pull', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 0, x: 195, y: 8 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ id: 0, x: 195, y: 96 }],
  });
  await expect(page.getByRole('status', { name: 'Release to refresh' })).toBeVisible();

  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { id: 0, x: 195, y: 96 },
      { id: 1, x: 215, y: 30 },
    ],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await client.detach();

  await expect(page.locator('.pull-refresh')).toBeHidden();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('test-loads')))
    .toBe('1');
});

test('touch jitter on an interactive control does not start a pull', async ({ page }) => {
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'touch-control';
    button.textContent = 'Test control';
    Object.assign(button.style, {
      height: '48px',
      left: '16px',
      position: 'fixed',
      top: '4px',
      width: '140px',
      zIndex: '2000',
    });
    button.addEventListener('click', () => sessionStorage.setItem('control-clicked', 'yes'));
    document.body.append(button);
  });

  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 80, y: 20 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 80, y: 40 }],
  });

  await expect(page.locator('.pull-refresh')).toBeHidden();
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await client.detach();

  await page.locator('#touch-control').tap();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('control-clicked')))
    .toBe('yes');
});

test('touch cancellation settles without refreshing', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 195, y: 8 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 195, y: 96 }],
  });
  await expect(page.getByRole('status', { name: 'Release to refresh' })).toBeVisible();
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  await client.detach();

  await expect(page.locator('.pull-refresh')).toBeHidden();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('test-loads')))
    .toBe('1');
});

test('reduced motion disables indicator transitions and spinning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const release = await dragFromTop(page, 96);
  await release();
  const sigil = page.locator('.pull-refresh__sigil');

  await expect(page.getByRole('status', { name: 'Refreshing' })).toBeVisible();
  await expect(sigil).toHaveCSS('animation-name', 'none');
  await expect(sigil).toHaveCSS('transition-duration', '0s');
});
