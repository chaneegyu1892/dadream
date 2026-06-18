import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정.
 * - 단일 chromium 프로젝트 (PWA + 카카오 OAuth는 chromium에서 검증)
 * - webServer는 사용자가 별도로 띄우는 것을 전제 (npm run dev 또는 npm run start)
 * - DB 마이그레이션과 시드는 별도 절차. 본 설정은 dev server만 다룬다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    // 카카오 OAuth는 외부 리다이렉트이므로 테스트에서는 비활성화
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // production 빌드 사용: dev server는 사용자가 별도 띄우거나 npm run dev:e2e 사용
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
