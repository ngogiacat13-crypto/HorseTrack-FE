import { expect, test, type APIRequestContext } from '@playwright/test';
import { liveAccounts, recordFinding, type LiveRole } from './live-support';

const SCHEDULE_RANGE = 'startDate=2020-01-01&endDate=2030-12-31';

const READS: Record<LiveRole, string[]> = {
  ClubManager: ['/account/my-profile', '/horses?page=0&size=50', '/horses?status=PENDING&page=0&size=50', '/horses?status=REJECTED&page=0&size=50', '/stalls', '/users/all', '/audit-logs/paged?page=0&size=20', '/protocols', '/protocols/shipments', '/care-tasks/overdue', '/billing/invoices?page=0&size=50', '/reports/finance', '/tournaments', '/race-proposals', '/race-proposals?complaintStatus=PENDING', '/race-proposals/reject-reasons'],
  Veterinarian: ['/account/my-profile', '/horses?page=0&size=50', '/stalls', '/medical/cases', '/protocols', '/medical-management/protocols', '/medical-management/medications', '/vaccinations', '/prerace-exams?tab=CHO_KHAM', '/prerace-exams?tab=DA_CO_KET_QUA', '/tournaments', '/race-proposals'],
  HeadTrainer: ['/account/my-profile', '/horses?page=0&size=50', '/stalls', '/training-plans?page=0&size=50', `/training-sessions/my-schedule?${SCHEDULE_RANGE}`, '/horses/available-for-training', '/prerace-exams?tab=CHO_KHAM', '/tournaments', '/race-proposals'],
  Groom: ['/account/my-profile', '/stalls', '/care-tasks/my-tasks', `/training-sessions/my-schedule?${SCHEDULE_RANGE}`, '/supply-requests/my'],
  WarehouseManager: ['/account/my-profile', '/inventory/items', '/inventory/protocols', '/inventory/supply-requests', '/inventory/purchase-orders', '/inventory/suppliers', '/inventory/stock-counts', '/inventory/transactions'],
  HorseOwner: ['/account/my-profile', '/tournaments', '/race-proposals', '/owner/tournaments'],
};

type Rows = Record<string, unknown>[];
const asRows = (data: unknown): Rows => {
  if (Array.isArray(data)) return data as Rows;
  const box = (data ?? {}) as { content?: Rows; horses?: Rows };
  return box.content ?? box.horses ?? [];
};

const firstValue = async (api: APIRequestContext, token: string, path: string, keys: string[]) => {
  const response = await api.get(`/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok()) return undefined;
  const row = asRows((await response.json()).data)[0];
  const key = keys.find((name) => row?.[name] !== undefined && row?.[name] !== null);
  return key ? String(row[key]) : undefined;
};

const DETAIL_READS: Partial<Record<LiveRole, { list: string; keys: string[]; detail: (id: string) => string[] }[]>> = {
  ClubManager: [
    { list: '/horses?page=0&size=50', keys: ['horseId'], detail: (id) => [`/horses/${id}`, `/horses/${id}/registrations`, `/horses/${id}/injuries`] },
    { list: '/tournaments', keys: ['tournamentId'], detail: (id) => [`/tournaments/${id}`, `/race-proposals?tournamentId=${id}`] },
    { list: '/race-proposals', keys: ['proposalId'], detail: (id) => [`/race-proposals/${id}`] },
  ],
  HeadTrainer: [{ list: '/training-plans?page=0&size=50', keys: ['planId'], detail: (id) => [`/training-plans/${id}`, `/training-plans/assignable-staff?planId=${id}`] }],
  Veterinarian: [{ list: '/medical-management/protocols', keys: ['protocolId', 'id'], detail: (id) => [`/medical-management/protocols/${id}`] }],
  WarehouseManager: [
    { list: '/inventory/protocols', keys: ['protocolId', 'id'], detail: (id) => [`/inventory/protocols/${id}`] },
    { list: '/inventory/stock-counts', keys: ['stockCountId', 'countId', 'id'], detail: (id) => [`/inventory/stock-counts/${id}`] },
  ],
};

const countOf = (body: string) => {
  try {
    const data = JSON.parse(body).data;
    return Array.isArray(data) ? data.length : asRows(data).length || undefined;
  } catch {
    return undefined;
  }
};

for (const account of liveAccounts()) {
  test(`${account.role} (${account.username}): các API đọc trả 2xx`, async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', { data: { username: account.username, password: account.password } });
    expect(login.status(), 'đăng nhập').toBe(200);
    const token = (await login.json()).data.accessToken as string;

    const reads = [...READS[account.role]];
    for (const source of DETAIL_READS[account.role] ?? []) {
      const id = await firstValue(request, token, source.list, source.keys);
      if (id) reads.push(...source.detail(id));
    }

    const failures: string[] = [];
    for (const path of reads) {
      const response = await request.get(`/api/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.text();
      recordFinding(account.role, { endpoint: `GET ${path}`, status: response.status(), count: countOf(body), message: response.ok() ? undefined : body.slice(0, 200) });
      if (!response.ok()) failures.push(`GET ${path} → ${response.status()}`);
    }
    expect(failures).toEqual([]);
  });
}
