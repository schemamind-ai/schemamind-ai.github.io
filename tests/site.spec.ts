import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/documents/', '/documents/proposal/'];
const proposalPdf = '/documents/schemamind-ai-project-proposal.pdf';

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1280) < 960;

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(new URL(page.url() || 'http://x').origin)) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  return errors;
}

for (const path of pages) {
  test.describe(`page ${path}`, () => {
    test('loads without errors and has the expected metadata', async ({ page }) => {
      const errors = trackErrors(page);
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);

      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page).toHaveTitle(/SchemaMind AI/);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/schemamind-ai\.github\.io\//);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png$/);
      expect(errors).toEqual([]);
    });

    test('has no horizontal overflow', async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('has no serious accessibility violations', async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      // Let the one-time hero animation finish so colours are measured in their final state.
      await page.waitForTimeout(2600);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });

    test('does not expose numeric identifiers or e-mail addresses', async ({ page }) => {
      await page.goto(path);
      const html = await page.content();
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/\d{9,}/);
      expect(html).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    });

    test('all links resolve and external links are safe', async ({ page, request }) => {
      await page.goto(path);
      const links = await page.locator('a[href]').evaluateAll((anchors) =>
        anchors.map((a) => ({
          href: (a as HTMLAnchorElement).href,
          raw: a.getAttribute('href') ?? '',
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel') ?? '',
        })),
      );
      const origin = new URL(page.url()).origin;

      for (const link of links) {
        const url = new URL(link.href);
        if (link.target === '_blank') expect(link.rel, link.raw).toContain('noopener');

        if (url.origin === origin) {
          const response = await request.get(url.pathname);
          expect(response.status(), link.raw).toBe(200);
          if (url.hash) {
            const target = url.hash.slice(1);
            const html = await response.text();
            expect(html, `anchor ${link.raw}`).toContain(`id="${target}"`);
          }
        } else {
          // Only GitHub and the site's own canonical domain are linked externally.
          expect(['https://github.com', 'https://schemamind-ai.github.io'], link.raw).toContain(url.origin);
        }
      }
    });
  });
}

test('404 page is served for unknown paths', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Page not found');
});

test.describe('navigation', () => {
  test('main navigation reaches every home-page section', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    const toggle = page.getByRole('button', { name: 'Menu' });

    for (const [label, id] of [
      ['About', 'about'],
      ['Research', 'research-questions'],
      ['Methodology', 'methodology'],
      ['Evaluation', 'evaluation'],
      ['Team', 'team'],
    ]) {
      if (isMobile(page)) await toggle.click();
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }

    if (isMobile(page)) await toggle.click();
    await nav.getByRole('link', { name: 'Documents', exact: true }).click();
    await expect(page).toHaveURL(/\/documents\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Reports and documents');
  });

  test('mobile menu opens, closes and reports its state', async ({ page }) => {
    test.skip(!isMobile(page), 'The menu button is only shown on narrow screens.');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menu' });
    const nav = page.getByRole('navigation', { name: 'Main' });

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav.getByRole('link', { name: 'About' })).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('desktop navigation is visible without a menu button', async ({ page }) => {
    test.skip(isMobile(page), 'Desktop only.');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' })).toBeVisible();
  });

  test('skip link moves focus to the main content', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not move focus to links with Tab by default.');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe('proposal document', () => {
  test('PDF is served with the right type and size', async ({ request }) => {
    const response = await request.get(proposalPdf);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    const body = await response.body();
    expect(body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(body.length).toBeGreaterThan(20_000);
    expect(body.length).toBeLessThan(5 * 1024 * 1024);
  });

  test('Download PDF button downloads the proposal', async ({ page }) => {
    await page.goto('/documents/proposal/');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('schemamind-ai-project-proposal.pdf');
  });

  test('View PDF button opens the proposal in a new tab', async ({ page, context }) => {
    await page.goto('/documents/');
    const link = page.getByRole('link', { name: /View PDF/ }).first();
    await expect(link).toHaveAttribute('href', proposalPdf);
    await expect(link).toHaveAttribute('target', '_blank');

    // Headless browsers have no PDF viewer and may turn the tab into a
    // download, so check that a new tab opens and requests the PDF.
    const [popup, pdfRequest] = await Promise.all([
      context.waitForEvent('page'),
      context.waitForEvent('request', (request) => request.url().endsWith(proposalPdf)),
      link.click(),
    ]);
    expect(popup).not.toBe(page);
    expect(pdfRequest.url()).toContain(proposalPdf);
  });

  test('proposal page shows the full public text without student numbers', async ({ page }) => {
    await page.goto('/documents/proposal/');
    const sheet = page.getByRole('article', { name: 'Proposal text' });
    for (const name of [
      'Namık Batın GAMBAZ',
      'Ömer Buğra KESKİN',
      'Berke MERT',
      'Tansel DÖKEROĞLU',
      'Kasım Murat KARAKAYA',
      'Deniz CANTÜRK',
    ]) {
      await expect(sheet).toContainText(name);
    }
    await expect(sheet).toContainText('We will test our models using SQL datasets such as BIRD');
    await expect(sheet).not.toContainText(/\d{9,}/);
  });
});

test.describe('content honesty', () => {
  test('home page states the proposal stage and promises no results', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.stage-note')).toContainText('No experiments have been carried out');
    await expect(page.locator('#evaluation')).toContainText('No experiments have been carried out yet');
    await expect(page.locator('#results')).toContainText('None yet');
    await expect(page.locator('#demo')).toContainText('Nothing on this website currently runs a language model');
    await expect(page.getByText('It is not output from a trained model')).toBeVisible();
  });
});

test('hero figure shows the renamed column when motion is reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const renamed = page.locator('.renamed .new');
  await expect(renamed).toHaveText('full_name');
  await expect(renamed).toHaveCSS('opacity', '1');
});
