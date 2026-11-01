import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('trainer race page shows the owner-led registration steps, not the old organizer flow', async ({ page }) => {
  await signIn(page, 'HeadTrainer', 'Trần Đức Hùng');
  await page.goto('/trainer/races');
  const stepper = page.getByTestId('race-entry-stepper');
  await expect(stepper).toBeVisible();
  await expect(page.getByTestId('race-entry-step-1')).toContainText('Chủ ngựa đề xuất');
  await expect(page.getByTestId('race-entry-step-2')).toContainText('HLV xác nhận');
  await expect(page.getByTestId('race-entry-step-3')).toContainText('Khám trước giải');
  await expect(page.getByTestId('race-entry-step-4')).toContainText('Đóng lệ phí');
  await expect(page.getByTestId('race-entry-step-5')).toContainText('Kết quả & giải thưởng');
  await expect(stepper).not.toContainText('Gửi ban tổ chức');
  await expect(page.getByTestId('races-go-confirm')).toHaveAttribute('href', '/trainer/race-confirmations');
});
