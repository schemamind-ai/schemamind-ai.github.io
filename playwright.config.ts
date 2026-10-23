import { defineConfig, devices } from '@playwright/test';

// Tests run against the local production preview by default. Set BASE_URL to
// test another deployment, e.g. BASE_URL=https://schemamind-ai.github.io npm test
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const local = !process.env.BASE_URL;

// WebKit (Safari engine) runs locally when installed; CI installs Chromium only.
const withWebKit = process.env.WEBKIT === '1';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ...(withWebKit
      ? [
          { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
          { name: 'desktop-safari', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  webServer: local
    ? {
        command: 'node scripts/serve-dist.mjs 4321',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }
    : undefined,
});
