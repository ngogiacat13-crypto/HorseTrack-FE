import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('vet adds medicine to a stock-available protocol, creating the next version sent to stock check', async ({ page }) => {
  await signIn(page, 'Veterinarian');
  await page.goto('/vet/protocols/PD-0012');
  await expect(page.getByText('Sửa phác đồ (phiên bản mới)')).toHaveCount(0);
  await page.getByTestId('add-items-btn').click();
  const dialog = page.getByTestId('add-items-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('dialog-confirm')).toBeDisabled();

  const select = page.getByTestId('add-item-select');
  await expect(select.locator('option')).not.toHaveCount(1);
  const firstItem = await select.locator('option').nth(1).getAttribute('value');
  await select.selectOption(firstItem!);
  await page.getByTestId('add-item-qty').fill('0');
  await page.getByTestId('add-item-line').click();
  await expect(dialog.getByText('Số lượng phải là số nguyên ≥ 1.')).toBeVisible();
  await page.getByTestId('add-item-qty').fill('2');
  await page.getByTestId('add-item-line').click();
  await expect(page.getByTestId('add-item-list').locator('tbody tr')).toHaveCount(1);

  await page.getByTestId('dialog-confirm').click();
  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/PD-0012$/);
  await expect(page.getByText('phiên bản 2')).toBeVisible();
});

test('add medicine is offered for a shortage protocol but not during treatment', async ({ page }) => {
  await signIn(page, 'Veterinarian');
  await page.goto('/vet/protocols/PD-0013');
  await expect(page.getByTestId('add-items-btn')).toBeVisible();
  await page.goto('/vet/protocols/PD-0009');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('add-items-btn')).toHaveCount(0);
});

test('vet cancels a protocol waiting for stock check, giving a reason', async ({ page }) => {
  await signIn(page, 'Veterinarian');
  await page.goto('/vet/protocols/PD-0014');
  await page.getByTestId('cancel-protocol-btn').click();
  await page.locator('#pd-text').fill('ngắn');
  await page.getByTestId('dialog-confirm').click();
  await expect(page.getByText('Lý do hủy phác đồ ít nhất 10 ký tự.')).toBeVisible();
  await page.locator('#pd-text').fill('Khám lại thấy cần đổi hướng điều trị');
  await page.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('cancel-protocol-btn')).toHaveCount(0);
  await expect(page.getByText('Phác đồ đã đóng.')).toBeVisible();
});

test('warehouse sees replaced protocols and what changed between versions', async ({ page }) => {
  await signIn(page, 'WarehouseManager');
  await page.goto('/warehouse/medical');
  await page.getByRole('tab', { name: /Bác sĩ đã đổi \/ hủy/ }).click();
  await expect(page.locator('td.id', { hasText: 'PD-0010' })).toBeVisible();
  await expect(page.getByText(/Đã thay bằng PD-0011/)).toBeVisible();
  await page.goto('/warehouse/medical/PD-0010');
  await expect(page.getByTestId('protocol-superseded')).toBeVisible();
  await page.goto('/warehouse/medical/PD-0011');
  await expect(page.getByText('Thay đổi so với PD-0010')).toBeVisible();
});
