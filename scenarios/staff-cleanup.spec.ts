import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('only an unconfirmed staff account offers resend, edit email and delete', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/users');
  await expect(page.getByTestId('resend-confirm-nvmoi')).toBeVisible();
  await expect(page.getByTestId('change-email-nvmoi')).toBeVisible();
  await expect(page.getByTestId('delete-user-nvmoi')).toBeVisible();
  await expect(page.getByTestId('change-email-vantoan')).toHaveCount(0);
  await expect(page.getByTestId('delete-user-vantoan')).toHaveCount(0);
});

test('the manager corrects the email of an unconfirmed staff account', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/users');
  await page.getByTestId('change-email-nvmoi').click();
  await page.getByTestId('change-email-input').fill('toan@horsetrack.vn');
  await page.getByTestId('change-email-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('change-email-error')).toContainText('Email đã được sử dụng');
  await page.getByTestId('change-email-input').fill('vanmoi@horsetrack.vn');
  await page.getByTestId('change-email-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('toast')).toContainText('vanmoi@horsetrack.vn');
  await expect(page.locator('tr', { hasText: 'nvmoi' })).toContainText('vanmoi@horsetrack.vn');
});

test('the manager deletes a staff account created by mistake', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/users');
  await page.getByTestId('delete-user-nvmoi').click();
  await page.getByTestId('delete-user-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('toast')).toContainText('Đã xóa tài khoản nvmoi');
  await expect(page.locator('tr', { hasText: 'nvmoi' })).toHaveCount(0);
});

test('a pending horse registration can be deleted with a reason; an approved one cannot', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/registrations/REG-0016');
  await expect(page.getByTestId('approve-registration-btn').or(page.getByText('Đã duyệt')).first()).toBeVisible();
  await expect(page.getByTestId('delete-registration-btn')).toHaveCount(0);

  await page.goto('/manager/registrations/REG-0020');
  await page.getByTestId('delete-registration-btn').click();
  const dialog = page.getByTestId('delete-registration-dialog');
  await expect(dialog.getByTestId('dialog-confirm')).toBeDisabled();
  await page.locator('#delete-registration-reason').fill('Chủ ngựa đăng ký trùng hai lần');
  await dialog.getByTestId('dialog-confirm').click();
  await expect(page).toHaveURL(/\/manager\/registrations$/);
  await expect(page.getByTestId('toast')).toContainText('Đã xóa hồ sơ ngựa');
});
