import { expect, test } from '@playwright/test';
import { signIn } from './support';

const bigPdf = () => {
  const head = Buffer.from('%PDF-1.4\n');
  return Buffer.concat([head, Buffer.alloc(5 * 1048576 - head.length, 0x20)]);
};

test('registration documents: PDF over 4 MB is rejected, large photos are compressed below 4 MB', async ({ page }) => {
  test.setTimeout(90_000);
  await signIn(page, 'HorseOwner');
  await page.goto('/owner/registrations/new');

  await page.getByTestId('doc-own-input').setInputFiles({ name: 'so-huu.pdf', mimeType: 'application/pdf', buffer: bigPdf() });
  await expect(page.getByText('PDF tối đa 4 MB', { exact: false })).toBeVisible();

  const pngBase64 = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2600;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(canvas.width, canvas.height);
    let seed = 12345;
    const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed & 0xff; };
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = next();
      img.data[i + 1] = next();
      img.data[i + 2] = next();
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    const bytes = new Uint8Array(await blob!.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  });
  const png = Buffer.from(pngBase64, 'base64');
  expect(png.length).toBeGreaterThan(4 * 1048576);

  await page.getByTestId('doc-health-input').setInputFiles({ name: 'suc-khoe.png', mimeType: 'image/png', buffer: png });
  const label = page.getByTestId('doc-health-upload');
  await expect(label).toContainText('suc-khoe.jpg');
  const mb = Number((await label.locator('small').textContent())?.match(/([\d.]+) MB/)?.[1]);
  expect(mb).toBeLessThan(4);
});
