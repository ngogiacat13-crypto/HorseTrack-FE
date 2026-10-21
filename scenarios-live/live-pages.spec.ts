import { expect, test, type Page } from '@playwright/test';
import { liveAccounts, liveSignIn, recordFinding, settle, watchLive } from './live-support';

const DETAIL_LINK: Record<string, RegExp> = {
  'nav-manager-registrations': /\/manager\/registrations\/[^/]+$/,
  'nav-trainer': /\/trainer\/horses\/[^/]+$/,
  'nav-trainer-schedule': /\/trainer\/sessions\/[^/]+$/,
  'nav-vet': /\/vet\/horses\/[^/]+$/,
  'nav-vet-protocols': /\/vet\/protocols\/(?!new)[^/]+$/,
  'nav-groom-sessions': /\/groom\/sessions\/[^/]+$/,
  'nav-warehouse-medical': /\/warehouse\/medical\/[^/]+$/,
  'nav-owner': /\/owner\/horses\/[^/]+$/,
};

type Rows = Record<string, unknown>[];
const readApi = (page: Page, path: string) => page.evaluate(async (apiPath) => {
  const tokens = JSON.parse(localStorage.getItem('horsetrack_tokens') ?? '{}') as { accessToken?: string };
  const response = await fetch(`/api/v1${apiPath}`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
  return response.ok ? (await response.json()).data : null;
}, path);
const rowsOf = (data: unknown): Rows => {
  if (Array.isArray(data)) return data as Rows;
  const box = (data ?? {}) as { content?: Rows; horses?: Rows };
  return box.content ?? box.horses ?? [];
};
const pad4 = (value: unknown) => String(value).padStart(4, '0');

const DETAIL_PAGES: Record<string, (page: Page) => Promise<string[]>> = {
  ClubManager: async (page) => {
    const horses = rowsOf(await readApi(page, '/horses?page=0&size=50'));
    const pending = horses.find((horse) => horse.stallId === null || horse.approvalStatus === 'PENDING');
    const approved = horses.find((horse) => horse.stallId !== null && horse.approvalStatus !== 'PENDING');
    return [pending, approved].filter(Boolean).map((horse) => `/manager/registrations/REG-${pad4(horse?.horseId)}`);
  },
  HeadTrainer: async (page) => {
    const horse = rowsOf(await readApi(page, '/horses?page=0&size=50'))[0];
    const plan = rowsOf(await readApi(page, '/training-plans?page=0&size=50'))[0];
    const detail = plan ? ((await readApi(page, `/training-plans/${plan.planId}`)) as { sessions?: Rows } | null) : null;
    const session = detail?.sessions?.[0];
    return [horse && `/trainer/horses/${horse.horseId}`, session && `/trainer/sessions/${session.sessionId}`].filter((path): path is string => !!path);
  },
  Veterinarian: async (page) => {
    const horse = rowsOf(await readApi(page, '/horses?page=0&size=50'))[0];
    const protocol = rowsOf(await readApi(page, '/medical-management/protocols'))[0];
    return [horse && `/vet/horses/${horse.horseId}`, protocol && `/vet/protocols/${protocol.protocolCode}`].filter((path): path is string => !!path);
  },
  WarehouseManager: async (page) => {
    const protocol = rowsOf(await readApi(page, '/inventory/protocols'))[0];
    return protocol ? [`/warehouse/medical/${protocol.protocolCode}`] : [];
  },
};

const pathOf = (page: Page) => page.url().replace(/^https?:\/\/[^/]+/, '');
const dangerTexts = (page: Page) => page.getByTestId('callout-danger').allInnerTexts().catch(() => [] as string[]);

for (const account of liveAccounts()) {
  test(`${account.role} (${account.username}): mọi trang chạy với backend thật`, async ({ page }) => {
    const live = watchLive(page);
    await liveSignIn(page, account);
    recordFinding(account.role, { page: 'login', calls: live.calls.splice(0), errors: live.errors.splice(0) });

    const menu = page.getByTestId('sidebar').locator('[data-testid^="nav-"]');
    const ids = await menu.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid') ?? ''));
    const broken: string[] = [];
    const check = async (label: string) => {
      const entry = { page: pathOf(page), menu: label, calls: live.calls.splice(0), errors: live.errors.splice(0), dangerText: await dangerTexts(page) };
      recordFinding(account.role, entry);
      if (entry.calls.some((call) => call.status >= 500) || entry.errors.length) broken.push(label);
    };

    for (const id of ids) {
      await page.getByTestId(id).click();
      await settle(page);
      await check(id);

      const detail = DETAIL_LINK[id];
      if (!detail) continue;
      const hrefs = await page.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''));
      const target = hrefs.find((href) => detail.test(href));
      if (!target) {
        recordFinding(account.role, { menu: `${id} → chi tiết`, skipped: 'không có liên kết chi tiết trên trang' });
        continue;
      }
      await page.goto(target);
      await settle(page);
      await check(`${id} → chi tiết`);
    }

    for (const target of await (DETAIL_PAGES[account.role]?.(page) ?? Promise.resolve([]))) {
      await page.goto(target);
      await settle(page);
      await check(`chi tiết ${target}`);
      if ((await dangerTexts(page)).some((text) => text.includes('Không tải được'))) broken.push(`chi tiết ${target}: không tải được dữ liệu`);
    }
    expect(broken, 'trang có lỗi 5xx hoặc lỗi JavaScript').toEqual([]);
  });
}
