/* Every URL of the app in one place. Use these instead of hard-coded strings in routes and menus. */
export const PATH = {
  /** "/" only redirects: guest → login, signed in → their workspace. */
  root: '/',
  /** Public intro page. */
  landing: '/gioi-thieu',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  myProfile: '/my-profile',
  changePassword: '/change-password',
  horseProfile: '/horses/:id',

  manager: {
    home: '/manager',
    registrations: '/manager/registrations',
    registrationDetail: '/manager/registrations/:id',
    medicalMonitoring: '/manager/medical-monitoring',
    oldProtocols: '/manager/protocols/*',
    invoices: '/manager/invoices',
    reports: '/manager/reports',
    users: '/manager/users',
    auditLogs: '/manager/audit-logs',
  },
  trainer: {
    home: '/trainer',
    horse: '/trainer/horses/:id',
    plans: '/trainer/plans',
    planCreate: '/trainer/plans/new',
    schedule: '/trainer/schedule',
    session: '/trainer/sessions/:id',
    races: '/trainer/races',
    proposalCreate: '/trainer/races/new',
    stable: '/trainer/stable',
  },
  vet: {
    home: '/vet',
    cases: '/vet/cases',
    horse: '/vet/horses/:id',
    protocols: '/vet/protocols',
    protocolCreate: '/vet/protocols/new',
    protocol: '/vet/protocols/:id',
    medicines: '/vet/medicines',
    vaccinations: '/vet/vaccinations',
    raceExams: '/vet/race-exams',
  },
  groom: {
    home: '/groom',
    stable: '/groom/stable',
    sessions: '/groom/sessions',
    session: '/groom/sessions/:id',
    incidents: '/groom/incidents',
    requests: '/groom/requests',
  },
  owner: {
    home: '/owner',
    horse: '/owner/horses/:id',
    races: '/owner/races',
    invoices: '/owner/invoices',
    invoice: '/owner/invoices/:id',
    payments: '/owner/payments',
    registrations: '/owner/registrations',
    registrationCreate: '/owner/registrations/new',
  },
  /** VNPay sandbox MOCK — full-page, outside the app layout. */
  vnpay: '/payment/vnpay/:id',
  warehouse: {
    home: '/warehouse',
    medical: '/warehouse/medical',
    medicalDetail: '/warehouse/medical/:id',
    requisitions: '/warehouse/requisitions',
    shipments: '/warehouse/shipments',
    check: '/warehouse/check',
    log: '/warehouse/log',
  },
} as const;

/** Fill a path pattern, e.g. toPath(PATH.vet.horse, { id: 'h-storm' }) → /vet/horses/h-storm */
export const toPath = (pattern: string, params: Record<string, string>) =>
  pattern.replace(/:([A-Za-z]+)/g, (_, k: string) => encodeURIComponent(params[k] ?? ''));
