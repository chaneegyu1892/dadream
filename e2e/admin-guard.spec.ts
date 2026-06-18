import { test, expect } from '@playwright/test';

/**
 * admin 라우트 가드 테스트 (골격).
 *
 * 시나리오:
 *  - 미로그인 상태로 /admin/approvals에 접근하면 /login으로 redirect.
 *  - 회원(member) 등급으로 로그인된 상태에서는 /admin 진입 불가 (officer+ 필요).
 *
 * 실제 카카오 OAuth 로그인은 E2E에서 자동화하지 않는다 (Kakao 자체 로그인 필요).
 * 인증된 상태는 쿠키 주입으로 시뮬레이션한다 (아래 storageState).
 */
test.describe('admin route guard', () => {
  test('미로그인 시 /admin/approvals → /login으로 redirect', async ({ page }) => {
    const response = await page.goto('/admin/approvals');
    // Next.js redirect는 307을 반환하고 location 헤더에 /login을 포함
    expect(page.url()).toMatch(/\/login/);
    // 응답 본문은 200 (redirect 후 새 페이지)
    expect(response?.status()).toBeLessThan(500);
  });

  test('로그인 페이지에 카카오 로그인 버튼이 있다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /카카오/ })).toBeVisible();
  });
});
