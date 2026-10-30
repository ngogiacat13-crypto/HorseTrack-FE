import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useAction } from '../../hooks/useAction';
import { Badge, Callout, Dialog, PageHeader, Panel, Segmented, money } from '../../components/ui/Ht';
import { Icon } from '../../components/ui/Icon';
import { LoadState } from '../../components/trainer/TrainerParts';
import { PATH } from '../../routers/routerPath';
import { criteriaText, fmtDate, registrationOpen } from './logic';
import { EntryBadge } from './parts';
import { clockNow, tournamentApi } from './tournamentApi';
import type { OwnerTournament } from './types';

type Filter = 'all' | 'fit';

const TournamentCard: React.FC<{ item: OwnerTournament; onPropose: (item: OwnerTournament, horseId: string) => void }> = ({ item, onPropose }) => {
  const { tournament: t, horses, myProposal } = item;
  const firstFit = horses.find((h) => h.eligible)?.horseId ?? '';
  const [pick, setPick] = useState(firstFit);
  const open = registrationOpen(t, clockNow());
  const locked = !!myProposal || !open || !item.eligible;
  return (
    <Panel title={t.name} sub={`${fmtDate(t.raceDate)} · ${t.location} · ${t.distanceM} m · lệ phí ${t.entryFee ? money(t.entryFee) : 'miễn phí'}`}
      right={<span data-testid={`tournament-fit-${t.id}`}><Badge tone={item.eligible ? 'success' : 'neutral'}>{item.eligible ? 'Phù hợp' : 'Không phù hợp'}</Badge></span>}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 12 }}>
        <div style={{ fontSize: 13 }}>{criteriaText(t)} · hạn đăng ký <b className="ht-mono">{fmtDate(t.registrationDeadline)}</b></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone={item.slotsLeft > 0 ? 'info' : 'warning'} plain>{item.slotsLeft > 0 ? `Còn ${item.slotsLeft}/${t.slots} suất` : `Hết suất · ${item.queueLength} đang chờ`}</Badge>
          {t.prizes[0] && <Badge tone="brand" plain>Giải nhất {money(t.prizes[0].amount)}</Badge>}
          {!open && <Badge tone="neutral" plain>{t.status === 'FINISHED' ? 'Đã kết thúc' : 'Hết hạn đăng ký'}</Badge>}
        </div>
        {myProposal && (
          <Callout tone="info" icon="info">
            Bạn đã đề xuất <b>{myProposal.horseName}</b> ({myProposal.id}) — <EntryBadge status={myProposal.status} />. Mỗi chủ ngựa chỉ một suất cho mỗi giải.{' '}
            <Link to={PATH.owner.raceEntries} data-testid={`tournament-my-entry-${t.id}`}>Xem đề xuất</Link>
          </Callout>
        )}
        <ul className="ht-checks" data-testid={`tournament-horses-${t.id}`}>
          {horses.map((h) => (
            <li key={h.horseId} className="ht-checkrow" data-state={h.eligible ? undefined : 'fail'} style={{ gridTemplateColumns: '28px 1fr auto' }}>
              <input type="radio" name={`pick-${t.id}`} aria-label={`Chọn ${h.horseName}`} data-testid={`tournament-pick-${t.id}-${h.horseId}`} disabled={!h.eligible || locked} checked={pick === h.horseId} onChange={() => setPick(h.horseId)} style={{ marginTop: 4 }} />
              <div>
                <b>{h.horseName}</b>
                {h.eligible ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>Đủ điều kiện</div> : <div style={{ fontSize: 12, color: 'var(--danger-ink)' }} data-testid={`horse-reasons-${t.id}-${h.horseId}`}>{h.reasons.join(' · ')}</div>}
              </div>
              <span title="Phong độ tính từ kết quả thi và đánh giá phiên tập gần đây"><Badge tone={h.formScore >= 70 ? 'success' : h.formScore >= 50 ? 'info' : 'neutral'} plain>Phong độ {h.formScore}</Badge></span>
            </li>
          ))}
          {horses.length === 0 && <li className="ht-empty">Bạn chưa có ngựa trong CLB.</li>}
        </ul>
        <div>
          <button type="button" className="ht-btn ht-btn--primary" data-testid={`tournament-propose-${t.id}`} disabled={locked || !pick} onClick={() => onPropose(item, pick)}>
            <Icon name="send" size={16} />{item.slotsLeft > 0 ? 'Đề xuất tham gia' : 'Vào hàng chờ'}
          </button>
        </div>
      </div>
    </Panel>
  );
};

export const OwnerTournaments: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => tournamentApi.ownerTournaments(actor), [actor]);
  const [filter, setFilter] = useState<Filter>('all');
  const [confirm, setConfirm] = useState<{ item: OwnerTournament; horseId: string } | null>(null);
  const act = useAction();
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const list = filter === 'fit' ? data.filter((x) => x.eligible) : data;
  const horseName = confirm ? confirm.item.horses.find((h) => h.horseId === confirm.horseId)?.horseName : '';
  const propose = async () => {
    if (!confirm) return;
    const full = confirm.item.slotsLeft === 0;
    if (await act.run(() => tournamentApi.propose(confirm.item.tournament, confirm.horseId, actor), full ? `${horseName} đã vào hàng chờ ${confirm.item.tournament.name}.` : `Đã giữ suất cho ${horseName} — chờ HLV xác nhận trong 2 ngày.`)) { setConfirm(null); reload(); }
  };

  return (
    <div className="ht ht-page">
      <PageHeader title="Giải đấu" sub="Hệ thống tự kiểm tra tuổi, cân nặng, giống, khóa y tế, điều trị và lịch trùng. Ai đề xuất trước giữ suất trước; mỗi giải bạn chỉ đăng ký 1 ngựa." />
      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <Segmented<Filter> label="Lọc giải" value={filter} onChange={setFilter} items={[{ value: 'all', label: `Tất cả (${data.length})` }, { value: 'fit', label: `Phù hợp (${data.filter((x) => x.eligible).length})` }]} />
      </div>
      <div style={{ display: 'grid', gap: 16 }} data-testid="owner-tournament-list">
        {list.map((item) => <TournamentCard key={item.tournament.id} item={item} onPropose={(i, horseId) => { act.setError(''); setConfirm({ item: i, horseId }); }} />)}
        {list.length === 0 && <div className="ht-empty">Không có giải nào phù hợp với ngựa của bạn.</div>}
      </div>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} busy={act.busy} icon="send" tone="brand" testId="propose-dialog"
        title={`Đề xuất ${horseName} · ${confirm?.item.tournament.name ?? ''}`}
        sub={confirm?.item.slotsLeft ? 'Giữ suất ngay. HLV xác nhận trong 2 ngày → bác sĩ khám trong 3 ngày → bạn nộp lệ phí trong 2 ngày. Quá hạn bước nào thì mất suất.' : 'Giải đã hết suất — bạn vào cuối hàng chờ, có người mất suất thì tự động được lên.'}
        confirmLabel="Xác nhận đề xuất" onConfirm={propose}>
        {act.error && <Callout tone="danger">{act.error}</Callout>}
      </Dialog>
    </div>
  );
};
