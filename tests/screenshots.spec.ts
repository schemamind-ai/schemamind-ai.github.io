import { test } from '@playwright/test';

// Full-page screenshots for visual review. Not part of the default run:
// SCREENSHOTS=1 npx playwright test screenshots
test.skip(!process.env.SCREENSHOTS, 'Set SCREENSHOTS=1 to capture review screenshots.');

const pages = [
  ['home', '/'],
  ['documents', '/documents/'],
  ['proposal', '/documents/proposal/'],
] as const;

for (const [name, path] of pages) {
  test(`screenshot ${name}`, async ({ page }, testInfo) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    await page.screenshot({
      path: `test-results/screens/${testInfo.project.name}-${name}.png`,
      fullPage: true,
    });
  });
}

test('screenshot first screen', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-first-screen.png` });
});

test('screenshot open mobile menu', async ({ page }, testInfo) => {
  test.skip((page.viewportSize()?.width ?? 1280) >= 960, 'Mobile only.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-menu.png` });
});

for (const [name, selector] of [
  ['methodology', '#methodology'],
  ['evaluation', '#evaluation'],
  ['documents-section', '#documents'],
  ['team', '#team'],
  ['demo', '#demo'],
] as const) {
  test(`screenshot section ${name}`, async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator(selector).screenshot({ path: `test-results/screens/${testInfo.project.name}-section-${name}.png` });
  });
}
