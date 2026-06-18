import { test, expect } from '@playwright/test';

/**
 * 오프라인 페이지 골격.
 *
 * 시나리오:
 *  - /__offline 직접 접근 시 안내 페이지가 표시되고 다시 시도 버튼이 있다.
 *
 * 실제 오프라인 시뮬레이션은 PWA 서비스워커 도입 후 가능. 현재는 라우트 존재만 검증.
 */
test('오프라인 안내 페이지가 렌더링된다', async ({ page }) => {
  await page.goto('/offline');
  await expect(page.getByRole('heading', { name: /오프라인/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /다시 시도/ })).toBeVisible();
});
