import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('the manager confirms a pending refund with a transfer reference, and it moves to done', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/refunds');
  await expect(page.getByTestId('refunds-pending-total')).toContainText('1 khoản chờ hoàn');
  const row = page.getByTestId('refund-row-2');
  await expect(row).toContainText('INV-0057');
  await expect(row).toContainText('Chờ hoàn');
  await expect(row).toContainText('0945678901');

  await page.getByTestId('refund-confirm-2').click();
  const dialog = page.getByTestId('refund-confirm-dialog');
  await expect(dialog.getByTestId('dialog-confirm')).toBeDisabled();
  await page.getByTestId('refund-ref-input').fill('FT2610030001');
  await page.getByTestId('refund-date-input').fill('2026-12-01');
  await dialog.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('refund-confirm-error')).toContainText('không được ở tương lai');
  await page.getByTestId('refund-date-input').fill('2026-10-03');
  await dialog.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('toast')).toContainText('Đã xác nhận hoàn');

  await expect(page.getByTestId('refunds-empty')).toBeVisible();
  await page.getByRole('tab', { name: /Đã hoàn/ }).click();
  await expect(page.getByTestId('refund-done-2')).toContainText('FT2610030001');
  await expect(page.getByTestId('refund-confirm-2')).toHaveCount(0);
});

test('a refund-pending invoice is labelled "Chờ hoàn" and links to the refunds screen', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/invoices');
  await page.getByTestId('manager-invoice-filter-refundPending').click();
  await expect(page.locator('tr', { hasText: 'INV-0057' })).toContainText('Chờ hoàn');
  await page.getByTestId('invoice-refund-INV-0057').click();
  await expect(page).toHaveURL(/\/manager\/refunds$/);
});

test('the owner sees the refund-pending invoice without a pay button', async ({ page }) => {
  await signIn(page, 'HorseOwner', 'Hoàng Thị Lan');
  await page.goto('/owner/invoices/INV-0057');
  await expect(page.getByTestId('owner-invoice-refund-pending')).toBeVisible();
  await expect(page.getByRole('button', { name: /Thanh toán qua VNPay/ })).toHaveCount(0);
});
