import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('club manager has an email log page in the menu', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.getByTestId('nav-manager-email-logs').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nhật ký email');
  await expect(page.getByTestId('email-log-status')).toBeVisible();
});

test('staff confirmation link without a token explains the problem', async ({ page }) => {
  await page.goto('/confirm-account');
  await expect(page.getByTestId('confirm-account-error')).toContainText('thiếu mã');
});

test('login shows the result passed back after staff confirmation', async ({ page }) => {
  await page.goto('/login?confirmed=true&message=%C4%90%C3%A3%20x%C3%A1c%20nh%E1%BA%ADn');
  await expect(page.getByTestId('login-confirm-result')).toContainText('Đã xác nhận');
});
