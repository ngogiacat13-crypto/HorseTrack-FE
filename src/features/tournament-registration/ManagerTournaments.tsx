import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useAction } from '../../hooks/useAction';
import { Callout, Dialog, PageHeader, Panel, Tabs } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { LoadState } from '../../components/trainer/TrainerParts';
import { criteriaText, fmtDate, holdingCount, waitlist } from './logic';
import { TournamentBadge } from './parts';
import { TOURNAMENT_DETAIL } from './labels';
import { TournamentForm } from './TournamentForm';
import { todayIso, tournamentApi } from './tournamentApi';
import type { RaceTournament, TournamentStatus } from './types';


export const ManagerTournaments: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => tournamentApi.managerTournaments());
  const [tab, setTab] = useState<TournamentStatus>('PUBLISHED');
  const [editing, setEditing] = useState<RaceTournament | 'new' | null>(null);
  const [publishing, setPublishing] = useState<RaceTournament | null>(null);
  const publish = useAction();
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const count = (s: TournamentStatus) => data.tournaments.filter((t) => t.status === s).length;
  const list = data.tournaments.filter((t) => t.status === tab).sort((a, b) => a.raceDate.localeCompare(b.raceDate));
  const doPublish = async () => {
    if (!publishing) return;
    if (await publish.run(() => tournamentApi.publish(publishing, actor), `Đã công bố ${publishing.name} — chủ ngựa đã thấy giải.`)) { setPublishing(null); reload(); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Giải đấu" sub="Quản lý CLB nhập các giải do ban tổ chức bên ngoài công bố để chủ ngựa biết và đề xuất tham gia. Hệ thống tự lọc ngựa đủ điều kiện; ai đề xuất trước được giữ suất trước."
        actions={<button type="button" className="ht-btn ht-btn--primary" data-testid="tournament-create-btn" onClick={() => setEditing('new')}><Icon name="download" size={16} />Nhập giải đấu</button>} />
      <Tabs<TournamentStatus> value={tab} onChange={setTab} items={[
        { value: 'PUBLISHED', label: 'Đang mở', count: count('PUBLISHED') },
        { value: 'DRAFT', label: 'Bản nháp', count: count('DRAFT') },
        { value: 'FINISHED', label: 'Đã kết thúc', count: count('FINISHED') },
      ]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table" data-testid="tournament-table">
            <thead><tr><th>Giải</th><th>Ngày thi · hạn ĐK</th><th>Điều kiện</th><th>Suất</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {list.map((t) => {
                const own = data.entries.filter((e) => e.tournamentId === t.id);
                return (
                  <tr key={t.id} data-testid={`tournament-row-${t.id}`}>
                    <td className="strong"><Link to={TOURNAMENT_DETAIL(t.id)} data-testid={`tournament-open-${t.id}`}>{t.name}</Link><span className="sub">{t.id} · {t.organizer} · {t.distanceM} m</span></td>
                    <td className="ht-mono">{fmtDate(t.raceDate)}<span className="sub">ĐK đến {fmtDate(t.registrationDeadline)}</span></td>
                    <td><span className="sub" style={{ marginTop: 0 }}>{criteriaText(t)}</span></td>
                    <td className="ht-mono">{holdingCount(own)}/{t.slots}<span className="sub">{waitlist(own).length} chờ</span></td>
                    <td><TournamentBadge status={t.status} /></td>
                    <td className="num">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {t.status !== 'FINISHED' && todayIso() < t.raceDate && <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" data-testid={`tournament-edit-${t.id}`} onClick={() => setEditing(t)}>Sửa</button>}
                        {t.status === 'DRAFT' && <button type="button" className="ht-btn ht-btn--primary ht-btn--sm" data-testid={`tournament-publish-${t.id}`} onClick={() => { publish.setError(''); setPublishing(t); }}>Công bố</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty" data-testid="tournament-empty">Chưa có giải nào ở mục này.</div>}
        </div>
      </Panel>
      {editing && <TournamentForm tournament={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
      <Dialog open={!!publishing} onClose={() => setPublishing(null)} busy={publish.busy} icon="send" tone="brand" testId="tournament-publish-dialog"
        title={`Công bố ${publishing?.name ?? ''}`} sub="Sau khi công bố, mọi chủ ngựa thấy giải và đề xuất được. Chỉ sửa được, không xóa." confirmLabel="Công bố" onConfirm={doPublish}>
        {publish.error && <Callout tone="danger">{publish.error}</Callout>}
        {publishing && <div style={{ fontSize: 13 }}>{criteriaText(publishing)} · {publishing.slots} suất · hạn đăng ký {fmtDate(publishing.registrationDeadline)}</div>}
      </Dialog>
    </div>
  );
};
