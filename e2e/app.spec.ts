import { test, expect } from '@playwright/test';

test('앱이 로드되고 노트 목록 영역이 보인다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Notes App');
});
