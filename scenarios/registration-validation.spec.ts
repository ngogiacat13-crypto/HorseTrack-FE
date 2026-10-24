import { expect, test } from '@playwright/test';
import { signIn } from './support';

test('owner sign-up checks Vietnamese phone and email format, full name is optional', async ({ page }) => {
  await page.goto('/register');
  await page.locator('#username').fill('chungua_test');
  await page.locator('#phone').fill('0123456789');
  await page.locator('#email').fill('chungua@gmail');
  await page.locator('#password').fill('Matkhau123');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByText('Số điện thoại di động Việt Nam gồm 10 chữ số').first()).toBeVisible();
  await expect(page.getByText('Email không hợp lệ (vd ten@gmail.com)').first()).toBeVisible();
  await expect(page.getByText('Vui lòng nhập họ và tên')).toHaveCount(0);
});

test('owner sign-up asks for the email OTP before creating the account', async ({ page }) => {
  await page.goto('/register');
  await page.locator('#username').fill('chungua_otp');
  await page.locator('#phone').fill('0987654321');
  await page.locator('#email').fill('chungua.otp@gmail.com');
  await page.locator('#password').fill('Matkhau123');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByTestId('register-otp-form')).toBeVisible();
  await expect(page.getByText('c***@gmail.com')).toBeVisible();
  await expect(page.getByTestId('register-otp-resend')).toHaveCount(0);
  await page.getByTestId('register-otp-input').fill('111111');
  await page.getByTestId('register-otp-submit').click();
  await expect(page.getByTestId('register-otp-error')).toBeVisible();
  await page.getByTestId('register-otp-input').fill('123456');
  await page.getByTestId('register-otp-submit').click();
  await expect(page.getByText('Đăng ký thành công!')).toBeVisible();
});

test('horse registration suggests breeds, has no passport field and rejects a renamed file', async ({ page }) => {
  await signIn(page, 'HorseOwner');
  await page.goto('/owner/registrations/new');
  await expect(page.getByTestId('registration-form')).toBeVisible();
  await expect(page.locator('#rg-passport')).toHaveCount(0);
  await expect(page.locator('#rg-healthCert')).toHaveCount(0);
  await page.getByTestId('rg-breed-input').click();
  await expect(page.getByTestId('rg-breed-option').first()).toBeVisible();
  expect(await page.getByTestId('rg-breed-option').count()).toBeGreaterThan(10);
  await page.getByTestId('rg-breed-input').fill('mong co');
  await page.getByTestId('rg-breed-option').filter({ hasText: 'Mông Cổ' }).click();
  await expect(page.getByTestId('rg-breed-input')).toHaveValue('Mông Cổ');

  await page.getByTestId('doc-own-input').setInputFiles({ name: 'so-huu.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(8 * 1024, 65) });
  await expect(page.getByText('nội dung tệp không phải PDF/JPG/PNG thật')).toBeVisible();

  await page.getByTestId('rg-name-input').fill('Gió Bắc');
  await page.getByTestId('rg-color-input').fill('Đen');
  await page.getByTestId('rg-height-input').fill('2m50');
  await page.getByTestId('registration-submit').click();
  await expect(page.getByText('Chiều cao đến vai tính bằng cm')).toBeVisible();
  await page.getByTestId('rg-height-input').fill('1m70');
  await page.getByTestId('rg-breed-input').fill('Ngựa gỗ');
  await page.getByTestId('registration-submit').click();
  await expect(page.getByText('chọn một giống trong danh sách gợi ý')).toBeVisible();
});
