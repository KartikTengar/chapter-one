import { devices } from '@playwright/test';

export default {
  testDir: ".",
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 120000,
};
