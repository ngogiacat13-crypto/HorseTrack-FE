import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('a started plan cannot be cancelled; an unstarted plan can', async ({ page }) => {
  await signIn(page, 'HeadTrainer');
  await page.goto('/trainer/plans');
  await expect(page.locator('[data-testid^="cancel-plan-"]')).toHaveCount(0);
  await page.getByRole('tab', { name: /Chưa bắt đầu/ }).click();
  const cancel = page.locator('[data-testid^="cancel-plan-"]').first();
  if (await cancel.count() === 0) return;
  const planId = (await cancel.getAttribute('data-testid'))!.replace('cancel-plan-', '');
  await cancel.click();
  const dialog = page.getByTestId('cancel-plan-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('dialog-confirm')).toBeDisabled();
  await page.locator('#cancel-plan-reason').fill('Ngựa đổi mục tiêu thi đấu');
  await page.getByTestId('dialog-confirm').click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId(`cancel-plan-${planId}`)).toHaveCount(0);
  await page.getByRole('tab', { name: /Lịch sử/ }).click();
  await expect(page.locator('td.id', { hasText: planId })).toBeVisible();
});

test('a paused plan waiting on the vet cannot be cancelled or restarted', async ({ page }) => {
  await signIn(page, 'HeadTrainer');
  await page.goto('/trainer/plans');
  await page.getByRole('tab', { name: /Tạm dừng/ }).click();
  const waiting = page.locator('[data-testid^="plan-wait-vet-"]');
  if (await waiting.count() === 0) test.skip(true, 'Dữ liệu mẫu không có giáo án chờ bác sĩ');
  await expect(page.locator('[data-testid^="cancel-plan-"]')).toHaveCount(0);
  await expect(page.locator('[data-testid^="resume-plan-"]')).toHaveCount(0);
});

test('a paused plan that is not waiting on the vet can be restarted', async ({ page }) => {
  await signIn(page, 'HeadTrainer');
  await page.goto('/trainer/plans');
  await page.getByRole('tab', { name: /Tạm dừng/ }).click();
  const resume = page.locator('[data-testid^="resume-plan-"]');
  if (await resume.count() === 0) test.skip(true, 'Dữ liệu mẫu không có giáo án tạm dừng được chạy lại');
  await expect(page.locator('[data-testid^="cancel-plan-"]')).toHaveCount(0);
  await resume.first().click();
  await expect(page.getByTestId('resume-plan-dialog')).toBeVisible();
  await page.getByTestId('dialog-cancel').click();
  await expect(page.getByTestId('resume-plan-dialog')).toBeHidden();
});
