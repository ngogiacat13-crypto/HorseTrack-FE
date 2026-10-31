import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('owner sees eligibility reasons, proposes one horse and holds a slot', async ({ page }) => {
  await signIn(page, 'HorseOwner', 'Đỗ Minh Quân');
  await page.getByTestId('nav-owner-tournaments').click();
  await expect(page.getByTestId('tournament-fit-GD-0003')).toContainText('Phù hợp');
  await expect(page.getByTestId('horse-reasons-GD-0003-h-arrow')).toContainText('Tuổi 3 nhỏ hơn tối thiểu 4');
  await expect(page.getByTestId('tournament-pick-GD-0003-h-arrow')).toBeDisabled();
  await expect(page.getByTestId('tournament-propose-GD-0001')).toBeDisabled();
  await page.getByTestId('tournament-propose-GD-0003').click();
  await page.getByTestId('propose-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('tournament-propose-GD-0003')).toBeDisabled();
  await page.getByTestId('tournament-my-entry-GD-0003').click();
  await expect(page.getByTestId('owner-entry-DK-0016')).toContainText('Chờ HLV xác nhận');
  await expect(page.getByTestId('owner-entry-deadline')).toContainText('05/10/2026 10:31');
  await expect(page.getByTestId('entry-cancel-btn')).toBeVisible();
});

test('trainer rejection needs a reason and frees the slot for the waitlist head', async ({ page }) => {
  await signIn(page, 'HeadTrainer', 'Trần Đức Hùng');
  await page.getByTestId('nav-trainer-race-confirmations').click();
  await page.getByTestId('trainer-reject-DK-0001').click();
  await page.getByTestId('trainer-decision-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('trainer-decision-dialog')).toContainText('Chọn lý do từ chối');
  await page.getByTestId('trainer-reason-code').selectOption('TRAINING_PLAN');
  await page.getByTestId('trainer-reason-note').fill('Trùng giai đoạn tăng tốc quan trọng của Flash.');
  await page.getByTestId('trainer-decision-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('trainer-approve-DK-0001')).toHaveCount(0);

  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('logout-btn').click();
  await signIn(page, 'ClubManager');
  await page.goto('/manager/tournaments/GD-0001');
  await expect(page.getByTestId('held-table')).toContainText('Blaze');
  await expect(page.getByTestId('entry-row-DK-0005')).toContainText('Chờ HLV xác nhận');
  await expect(page.getByTestId('waitlist-table')).not.toContainText('Blaze');
});

test('vet pass issues the entry fee invoice for the owner', async ({ page }) => {
  await signIn(page, 'Veterinarian');
  await page.getByTestId('nav-vet-race-exams').click();
  await expect(page.getByTestId('vet-entry-deadline-DK-0002')).toContainText('04/10/2026 08:30');
  await page.getByTestId('vet-exam-DK-0002').click();
  await page.getByTestId('vet-exam-note').fill('Tim phổi bình thường, dáng đi đều.');
  await page.getByTestId('vet-exam-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('vet-exam-DK-0002')).toHaveCount(0);

  await page.getByTestId('user-menu-btn').click();
  await page.getByTestId('logout-btn').click();
  await signIn(page, 'HorseOwner', 'Hoàng Thị Lan');
  await page.getByTestId('nav-owner-race-entries').click();
  await page.getByTestId('owner-entry-DK-0002').click();
  await expect(page.getByTestId('owner-entry-DK-0002')).toContainText('Chờ nộp lệ phí');
  await expect(page.getByTestId('entry-pay-btn')).toHaveAttribute('href', /\/owner\/invoices\/INV-/);
});

test('manager records results with prize money and resolves a complaint', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.goto('/manager/tournaments');
  await expect(page.getByTestId('tournament-row-GD-0005')).toContainText('Chờ nhập kết quả');
  await page.goto('/manager/tournaments/GD-0002');
  await expect(page.getByTestId('tournament-results-btn')).toHaveCount(0);
  await page.goto('/manager/tournaments/GD-0005');
  await page.getByTestId('tournament-results-btn').click();
  for (const [id, rank, time] of [['DK-0011', '2', '1:12.80'], ['DK-0012', '1', '1:12.10'], ['DK-0013', '3', '1:13.05']]) {
    await page.getByTestId(`result-rank-${id}`).fill(rank);
    await page.getByTestId(`result-time-${id}`).fill(time);
  }
  await page.getByTestId('tournament-results-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('entry-row-DK-0012')).toContainText('20.000.000 ₫');
  await expect(page.getByTestId('tournament-results-btn')).toHaveCount(0);

  await page.getByTestId('nav-manager-race-complaints').click();
  await page.getByTestId('complaint-accept-DK-0009').click();
  await page.getByTestId('complaint-note').fill('Đã xem kết quả tập, ngựa đủ thể lực cho cự ly này.');
  await page.getByTestId('complaint-decision-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('complaint-empty')).toBeVisible();
});

test('manager imports an external tournament with complete data, VND fee and date rules, then publishes it', async ({ page }) => {
  await signIn(page, 'ClubManager');
  await page.getByTestId('nav-manager-tournaments').click();
  await expect(page.getByTestId('tournament-row-GD-0001')).toBeVisible();
  await expect(page.getByTestId('tournament-edit-GD-0001')).toHaveCount(0);
  await page.getByTestId('tournament-create-btn').click();
  const dialog = page.getByTestId('tournament-form-dialog');
  await expect(dialog).toContainText('Nhập giải đấu');
  await dialog.getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('tournament-form-missing')).toBeVisible();
  await expect(dialog).toContainText('Nhập tuổi tối thiểu');
  await expect(dialog).toContainText('Nhập cân nặng tối đa');
  await expect(dialog).toContainText('Chọn ít nhất một giống');

  await page.getByTestId('tournament-name').fill('Giải thử nghiệm mùa đông');
  await page.getByTestId('tournament-organizer').fill('CLB Đua ngựa HCM');
  await page.getByTestId('tournament-location').fill('Trường đua Đại Nam');
  await page.getByTestId('tournament-raceDate').fill('2026-10-06');
  await expect(dialog).toContainText('Ngày thi đấu phải sau hôm nay ít nhất 5 ngày');
  await page.getByTestId('tournament-raceDate').fill('2026-12-20');
  await page.getByTestId('tournament-registrationDeadline').fill('2026-12-18');
  await expect(dialog).toContainText('Hạn đăng ký phải trước ngày thi đấu ít nhất 3 ngày');
  await page.getByTestId('tournament-registrationDeadline').fill('2026-12-10');

  const fee = page.getByTestId('tournament-entryFee');
  await fee.fill('5.000.000');
  await expect(fee).toHaveValue('5.000.000');
  await fee.dblclick();
  expect(await fee.evaluate((el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!)).toBe('5.000.000'.length);

  await page.getByTestId('tournament-minAgeYears').fill('3');
  await page.getByTestId('tournament-maxAgeYears').fill('8');
  await page.getByTestId('tournament-minWeightKg').fill('420');
  await page.getByTestId('tournament-maxWeightKg').fill('560');
  await page.getByTestId('tournament-breed-all').click();
  await page.getByTestId('tournament-prize-amount-0').fill('50000000');
  await expect(page.getByTestId('tournament-prize-amount-0')).toHaveValue('50.000.000');
  await expect(page.getByTestId('tournament-prize-rank-2')).toHaveText('Hạng 3');
  await page.getByTestId('tournament-prize-amount-1').fill('30000000');
  await page.getByTestId('tournament-prize-amount-2').fill('10000000');
  await page.getByTestId('tournament-prize-add').click();
  await page.getByTestId('tournament-prize-add').click();
  await expect(page.getByTestId('tournament-prize-add')).toHaveCount(0);
  await page.getByTestId('tournament-prize-remove-4').click();
  await page.getByTestId('tournament-prize-amount-3').fill('5000000');
  await expect(page.getByTestId('tournament-prize-remove-2')).toHaveCount(0);
  await dialog.getByTestId('dialog-confirm').click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole('tab', { name: /Bản nháp/ }).click();
  await expect(page.getByTestId('tournament-row-GD-0006')).toContainText('Giải thử nghiệm mùa đông');
  await page.getByTestId('tournament-publish-GD-0006').click();
  await page.getByTestId('tournament-publish-dialog').getByTestId('dialog-confirm').click();
  await expect(page.getByTestId('tournament-row-GD-0006')).toHaveCount(0);
});

test('trainer cannot plan HIGH intensity within 7 days before a registered race', async ({ page }) => {
  await signIn(page, 'HeadTrainer', 'Trần Đức Hùng');
  await page.goto('/trainer/plans/new?horse=h-galaxy');
  await expect(page.getByTestId('plan-race-rest-block')).toHaveCount(0);
  await page.locator('#i0').selectOption('Cao');
  await expect(page.getByTestId('plan-race-rest-block')).toContainText('08/10/2026');
});
