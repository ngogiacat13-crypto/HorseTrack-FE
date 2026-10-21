import type { managerApi } from '../../../api/managerApi';

export type Dash = Awaited<ReturnType<typeof managerApi.getDashboard>>;
