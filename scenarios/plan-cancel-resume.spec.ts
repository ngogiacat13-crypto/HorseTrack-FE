import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('head trainer cancels a running plan with a reason and it moves to history', async ({ page }) => {
  await signIn(page, 'HeadTrainer');
  await page.goto('/trainer/plans');
  const cancel = page.locator('[data-testid^="cancel-plan-"]').first();
  await expect(cancel).toBeVisible();
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

test('a paused plan offers "Chạy lại" next to "Hủy"', async ({ page }) => {
  await signIn(page, 'HeadTrainer');
  await page.goto('/trainer/plans');
  await page.getByRole('tab', { name: /Tạm dừng/ }).click();
  const resume = page.locator('[data-testid^="resume-plan-"]');
  if (await resume.count() === 0) test.skip(true, 'Dữ liệu mẫu không có giáo án tạm dừng');
  const planId = (await resume.first().getAttribute('data-testid'))!.replace('resume-plan-', '');
  await expect(page.getByTestId(`cancel-plan-${planId}`)).toBeVisible();
  await resume.first().click();
  await expect(page.getByTestId('resume-plan-dialog')).toBeVisible();
  await page.getByTestId('dialog-cancel').click();
  await expect(page.getByTestId('resume-plan-dialog')).toBeHidden();
});
