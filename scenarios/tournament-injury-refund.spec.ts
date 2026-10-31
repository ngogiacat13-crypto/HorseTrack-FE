import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('vet lock warns and owner sees ineligible proposal and refunded fee without actions', async ({ page }) => {
  await signIn(page, 'Veterinarian');
  await page.goto('/vet/horses/h-arrow');
  await page.getByRole('button', { name: 'Khóa huấn luyện' }).click();
  await expect(page.getByTestId('lock-race-refund-warning')).toContainText('Ngựa đang có đăng ký giải đấu sẽ bị hủy đăng ký và hoàn lệ phí');
  await page.getByTestId('dialog-cancel').click();

  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('logout-btn').click();
  await signIn(page, 'HorseOwner', 'Đỗ Minh Quân');
  await page.getByTestId('nav-owner-race-entries').click();
  await page.getByTestId('owner-entry-DK-0015').click();
  await expect(page.getByTestId('owner-entry-ineligible')).toContainText('Ngựa không còn đủ điều kiện');
  await expect(page.getByTestId('owner-entry-ineligible')).toContainText('Ngựa bị khóa huấn luyện: Chấn thương chân trước trái.');
  await expect(page.getByTestId('owner-entry-ineligible')).toContainText('03/10/2026 10:15');
  await expect(page.getByTestId('owner-entry-refund')).toContainText('INV-0056');
  await expect(page.getByTestId('owner-entry-refund')).toContainText('5.000.000 ₫');
  await expect(page.getByTestId('entry-cancel-btn')).toHaveCount(0);
  await expect(page.getByTestId('entry-complain-btn')).toHaveCount(0);
  await expect(page.getByTestId('entry-pay-btn')).toHaveCount(0);

  await page.getByTestId('nav-owner-invoices').click();
  const ownerInvoice = page.getByRole('row').filter({ hasText: 'INV-0056' });
  await expect(ownerInvoice).toContainText('Đã hoàn tiền');
  await expect(ownerInvoice).toContainText('5.000.000 ₫');
  await expect(ownerInvoice.locator('td').nth(5)).toHaveText(/0\s*₫/);
  await ownerInvoice.getByTestId('owner-refunded-invoice-INV-0056').click();
  await expect(page.getByTestId('owner-invoice-refunded')).toContainText('5.000.000 ₫');
  await expect(page.getByRole('button', { name: 'Thanh toán qua VNPay' })).toHaveCount(0);
});

test('manager can filter refunded invoices without payment or debt actions', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/invoices');
  await page.getByTestId('manager-invoice-filter-refunded').click();
  const invoice = page.getByTestId('manager-invoice-row-INV-0056');
  await expect(invoice).toContainText('Đã hoàn tiền');
  await expect(invoice.locator('button')).toHaveCount(0);
  await expect(invoice).toContainText('—');
});

test('owner sees trainer confirmation deadline instead of a waitlist position', async ({ page }) => {
  await signIn(page, 'HorseOwner', 'Đỗ Minh Quân');
  await page.getByTestId('nav-owner-race-entries').click();
  const entry = page.getByTestId('owner-entry-DK-0001');
  await expect(entry).toContainText('Chờ HLV xác nhận');
  await expect(page.getByTestId('owner-entry-deadline-DK-0001')).toContainText('04/10/2026 09:00');
  await expect(entry).not.toContainText('Vị trí chờ');
});

test('race notification destinations open for each recipient role', async ({ page }) => {
  await signIn(page, 'HorseOwner', 'Đỗ Minh Quân');
  await page.goto('/owner/race-entries');
  await expect(page.getByTestId('page-title')).toContainText('Đề xuất của tôi');

  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('logout-btn').click();
  await signIn(page, 'HeadTrainer');
  await page.goto('/trainer/race-confirmations');
  await expect(page.getByTestId('page-title')).toContainText('Xác nhận thi đấu');

  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('logout-btn').click();
  await signIn(page, 'ClubManager');
  await page.goto('/manager/invoices');
  await expect(page.getByTestId('page-title')).toContainText('Hóa đơn');
});
