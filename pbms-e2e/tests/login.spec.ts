import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Cập nhật title phù hợp với trang web của bạn
  await expect(page).toHaveTitle(/PBMS/i);
});

test('login flow', async ({ page }) => {
  await page.goto('/login');
  
  // Bạn có thể viết tiếp kịch bản test tại đây, độc lập hoàn toàn với mã nguồn gốc của web
  // await page.fill('input[type="email"]', 'admin@admin.com');
  // await page.fill('input[type="password"]', 'admin');
  // await page.click('button[type="submit"]');
  // await expect(page).toHaveURL(/.*dashboard/);
});
