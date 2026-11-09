import { expect, test, type Page } from '@playwright/test';
import { signIn } from './support';

const TRAINER = 'Lê Minh Tâm';

const fillPlan = async (page: Page, horseId: string, name: string) => {
  await page.goto(`/trainer/plans/new?horse=${horseId}`);
  await page.locator('#plan-name').fill(name);
  await page.locator('#goal').fill('Chuẩn bị mùa giải');
};

test('a plan cannot be saved without a track, and the distance field is gone', async ({ page }) => {
  await signIn(page, 'HeadTrainer', TRAINER);
  await fillPlan(page, 'h-arrow', 'Giáo án chọn đường');
  await expect(page.getByText('Quãng đường (m)')).toHaveCount(0);
  await page.getByTestId('plan-save').click();
  await expect(page.getByTestId('plan-single-phase')).toContainText('Chọn loại đường tập');
  await expect(page).toHaveURL(/plans\/new/);
  await page.getByTestId('plan-track-select').selectOption('TURF');
  await expect(page.getByTestId('plan-summary-track')).toHaveText('Đường cỏ');
  await page.getByTestId('plan-save').click();
  await expect(page).toHaveURL(/\/trainer\/plans$/);
  await expect(page.getByTestId('toast')).toContainText('Giáo án chọn đường');
});

for (const [track, label] of [['SYNTHETIC', 'Cỏ nhân tạo'], ['DIRT', 'Đường đất'], ['TURF', 'Đường cỏ']] as const) {
  test(`a plan saves with track ${label}`, async ({ page }) => {
    await signIn(page, 'HeadTrainer', TRAINER);
    await fillPlan(page, 'h-arrow', `Giáo án ${label}`);
    await page.getByTestId('plan-track-select').selectOption(track);
    await page.getByTestId('plan-save').click();
    await expect(page).toHaveURL(/\/trainer\/plans$/);
    await page.getByRole('tab', { name: /Chưa bắt đầu/ }).click();
    await expect(page.locator('tr', { hasText: `Giáo án ${label}` })).toContainText(label);
  });
}

test('two horses can share a track: the clash is checked per session time, not per plan', async ({ page }) => {
  await signIn(page, 'HeadTrainer', TRAINER);
  await fillPlan(page, 'h-arrow', 'Giáo án ngựa đầu');
  await page.getByTestId('plan-track-select').selectOption('DIRT');
  await page.getByTestId('plan-save').click();
  await expect(page).toHaveURL(/\/trainer\/plans$/);

  await page.getByRole('link', { name: 'Tạo giáo án' }).click();
  await page.locator('#horse').selectOption('h-blaze');
  await page.locator('#plan-name').fill('Giáo án ngựa thứ hai');
  await page.locator('#goal').fill('Chuẩn bị mùa giải');
  await page.getByTestId('plan-track-select').selectOption('DIRT');
  await page.getByTestId('plan-save').click();
  await expect(page).toHaveURL(/\/trainer\/plans$/);
  await expect(page.getByTestId('plan-server-error')).toHaveCount(0);
});

test('changing the plan type previews that type\'s five steps and keeps the chosen track', async ({ page }) => {
  await signIn(page, 'HeadTrainer', TRAINER);
  await page.goto('/trainer/plans/new?horse=h-wind');
  const preview = page.getByTestId('plan-guide-preview');
  await expect(preview.locator('ol li')).toHaveCount(5);
  await expect(preview).toContainText('giữ nhịp đều');
  await page.getByTestId('plan-track-select').selectOption('TURF');
  await page.getByRole('button', { name: 'Tốc độ' }).click();
  await expect(preview).toContainText('đoạn nhanh ngắn');
  await expect(preview.locator('ol li')).toHaveCount(5);
  await expect(page.getByTestId('plan-track-select')).toHaveValue('TURF');
});

test('a plan not started can be adjusted with the horse locked; a running plan offers no adjust button', async ({ page }) => {
  await signIn(page, 'HeadTrainer', TRAINER);
  await fillPlan(page, 'h-blaze', 'Giáo án để điều chỉnh');
  await page.getByTestId('plan-track-select').selectOption('SYNTHETIC');
  await page.getByTestId('plan-save').click();
  await expect(page).toHaveURL(/\/trainer\/plans$/);

  await expect(page.locator('[data-testid^="edit-plan-"]')).toHaveCount(0);
  await page.getByRole('tab', { name: /Chưa bắt đầu/ }).click();
  await page.locator('[data-testid^="edit-plan-"]').first().click();
  await expect(page).toHaveURL(/\/trainer\/plans\/.+\/edit$/);
  await expect(page.locator('#horse')).toBeDisabled();
  await expect(page.locator('#horse')).toHaveValue('h-blaze');
  await expect(page.locator('#plan-name')).toHaveValue('Giáo án để điều chỉnh');
  await expect(page.getByTestId('plan-track-select')).toHaveValue('SYNTHETIC');
  await page.getByTestId('plan-track-select').selectOption('DIRT');
  await page.getByRole('button', { name: 'Kỹ thuật' }).click();
  await page.getByTestId('plan-save').click();
  await expect(page).toHaveURL(/\/trainer\/plans$/);
  await expect(page.getByTestId('toast')).toContainText('Đã điều chỉnh');
  await page.getByRole('tab', { name: /Chưa bắt đầu/ }).click();
  await expect(page.locator('tr', { hasText: 'Giáo án để điều chỉnh' })).toContainText('Đường đất');
  await expect(page.locator('tr', { hasText: 'Giáo án để điều chỉnh' })).toContainText('Kỹ thuật');
});

test('opening the edit route of a running plan is refused', async ({ page }) => {
  await signIn(page, 'HeadTrainer', TRAINER);
  await page.goto('/trainer/plans/KH-0014/edit');
  await expect(page.getByTestId('plan-edit-blocked')).toContainText('Chỉ điều chỉnh được giáo án chưa bắt đầu');
});

test('the horse record shows the groom guide; assigning uses the plan track and an old plan offers the three tracks', async ({ page }) => {
  await signIn(page, 'HeadTrainer', TRAINER);
  await page.goto('/trainer/horses/h-thunder');
  await expect(page.getByTestId('horse-plan-guide')).toContainText('giữ nhịp đều');
  await expect(page.getByTestId('horse-plan-guide').locator('ol li')).toHaveCount(5);

  await page.goto('/trainer/schedule');
  await page.getByRole('button', { name: 'Phân công phiên tập' }).click();
  await expect(page.getByTestId('assign-track-readonly')).toHaveValue('');
  await page.getByTestId('assign-zone-select').selectOption('Khu B');
  await page.getByTestId('assign-horse-select').selectOption('h-thunder');
  await expect(page.getByTestId('assign-track-select').locator('option')).toHaveCount(4);
});

test('a groom reads the type, track and numbered steps above the action buttons', async ({ page }) => {
  await signIn(page, 'Groom');
  await page.goto('/groom/sessions');
  await page.locator('a[href^="/groom/sessions/"]').first().click();
  const guide = page.getByTestId('session-guide');
  await expect(guide.locator('ol li')).toHaveCount(5);
  const guideBox = await guide.boundingBox();
  const actionsBox = await page.getByRole('heading', { name: 'Thao tác' }).boundingBox();
  expect(guideBox!.y).toBeLessThan(actionsBox!.y);
});
