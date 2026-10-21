import { defineConfig } from '@playwright/test';

const PORT = 5198;

export default defineConfig({
  testDir: './scenarios-live',
  outputDir: 'test-results/live',
  timeout: 180_000,
  workers: 2,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite --mode backend --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
