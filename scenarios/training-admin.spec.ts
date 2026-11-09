import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('the manager gives an old open plan a track', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/training');
  await expect(page.getByTestId('admin-plan-track-KH-0014')).toHaveText('Chưa có loại đường');
  await page.getByTestId('set-track-KH-0014').click();
  const dialog = page.getByTestId('set-track-dialog');
  await expect(dialog.getByTestId('dialog-confirm')).toBeDisabled();
  await page.getByTestId('set-track-select').selectOption('DIRT');
  await dialog.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('admin-plan-track-KH-0014')).toHaveText('Đường đất');
  await expect(page.getByTestId('set-track-KH-0014')).toHaveCount(0);
});

test('force cancelling a plan needs a reason and closes it', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/training');
  await page.getByTestId('force-cancel-KH-0013').click();
  const dialog = page.getByTestId('force-cancel-dialog');
  await expect(dialog.getByTestId('dialog-confirm')).toBeDisabled();
  await page.locator('#force-cancel-reason').fill('HLV nghỉ việc, giáo án bị bỏ dở');
  await dialog.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('toast')).toContainText('Đã hủy cưỡng chế giáo án KH-0013');
  await expect(page.getByTestId('admin-plan-KH-0013')).toHaveCount(0);
  await page.getByRole('tab', { name: /Tất cả/ }).click();
  await expect(page.getByTestId('admin-plan-KH-0013')).toContainText('Đã hủy');
  await expect(page.getByTestId('force-cancel-KH-0013')).toHaveCount(0);
});

test('force closing an unfinished session from the plan list', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/training');
  await page.getByTestId('admin-plan-sessions-KH-0015').click();
  await expect(page.getByTestId('admin-session-S-0025')).toContainText('Chờ Mã phu xác nhận');
  await page.getByTestId('force-close-S-0025').click();
  const dialog = page.getByTestId('force-close-dialog');
  await expect(dialog.getByTestId('dialog-confirm')).toBeDisabled();
  await page.locator('#force-close-reason').fill('Mã phu quên kết thúc buổi');
  await dialog.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('toast')).toContainText('Đã đóng buổi S-0025');
  await expect(page.getByTestId('admin-session-S-0025')).toContainText('Đã hủy');
  await expect(page.getByTestId('force-close-S-0025')).toHaveCount(0);
});
