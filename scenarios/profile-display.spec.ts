import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('owner registration does not show the default-role note', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByText('Vai trò mặc định: Chủ ngựa', { exact: true })).toHaveCount(0);
});

test('profiles do not offer avatar changes', async ({ page }) => {
  await signIn(page, 'Groom');
  await page.goto('/my-profile');
  await expect(page.getByText('Đổi ảnh', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('profile-avatar')).toHaveCount(0);
});

test('profile fields follow each staff role', async ({ page }) => {
  await signIn(page, 'Groom');
  await page.goto('/my-profile');
  await expect(page.getByText('Mã chứng chỉ / mã nhân viên', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Khu phụ trách', { exact: true })).toBeVisible();
  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('logout-btn').click();

  await signIn(page, 'HeadTrainer');
  await page.goto('/my-profile');
  await expect(page.getByText('Mã chứng chỉ / mã nhân viên', { exact: true })).toBeVisible();
  await expect(page.getByText('Chuyên môn', { exact: true })).toHaveCount(0);
  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('logout-btn').click();

  await signIn(page, 'Veterinarian');
  await page.goto('/my-profile');
  await expect(page.getByText('Chuyên môn', { exact: true })).toHaveCount(0);
  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('logout-btn').click();

  await signIn(page, 'WarehouseManager');
  await page.goto('/my-profile');
  await expect(page.getByText('Mã chứng chỉ / mã nhân viên', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Chuyên môn', { exact: true })).toHaveCount(0);
});
