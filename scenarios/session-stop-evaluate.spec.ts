import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('trainer evaluates a session that was stopped and sent to the vet', async ({ page }) => {
  await signIn(page, 'HeadTrainer');
  await page.goto('/trainer/sessions/S-0023');
  await expect(page.getByTestId('session-sent-vet')).toContainText('C-0015');
  await expect(page.getByText(/chờ kết luận/i)).toHaveCount(0);
  await page.getByTestId('session-evaluate-btn').click();
  await page.getByRole('group').getByRole('button', { name: '7', exact: true }).click();
  await page.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('session-evaluate-btn')).toHaveCount(0);
});
