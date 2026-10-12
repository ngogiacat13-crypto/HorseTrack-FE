import type { managerApi } from '../../../api/managerApi';

/** Everything the dashboard shows, as returned by managerApi.getDashboard(). */
export type Dash = Awaited<ReturnType<typeof managerApi.getDashboard>>;
