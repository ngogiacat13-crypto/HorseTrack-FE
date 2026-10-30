import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { Callout, Dialog } from '../../components/ui/Ht';
import { fmtDateTime } from './logic';
import { TournamentFacts } from './parts';
import { tournamentApi } from './tournamentApi';
import type { RaceEntry } from './types';

export const DossierDialog: React.FC<{ entry: RaceEntry; onClose: () => void }> = ({ entry, onClose }) => {
  const { data, error } = useFetch(() => tournamentApi.dossier(entry), [entry.id]);
  return (
    <Dialog open onClose={onClose} icon="file" tone="brand" width={680} testId="entry-dossier-dialog"
      title={`Hồ sơ đăng ký · ${entry.horseName}`} sub="Hệ thống tự tạo, chỉ để xem. CLB gửi hồ sơ cho ban tổ chức ngoài hệ thống." confirmLabel="Đóng" onConfirm={onClose}>
      {error && <Callout tone="danger">{error}</Callout>}
      {!data && !error && <div className="ht-empty">Đang tạo hồ sơ…</div>}
      {data && (
        <div style={{ display: 'grid', gap: 14 }} data-testid="entry-dossier">
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Mã hồ sơ <b className="ht-mono">{data.entryId}</b> · tạo lúc {fmtDateTime(data.generatedAt)}</div>
          <TournamentFacts t={data.tournament} />
          <dl className="ht-kv">
            <dt>Ngựa</dt><dd><b>{data.horse.name}</b> · {data.horse.breed}{data.horse.sex ? ` · ${data.horse.sex}` : ''}</dd>
            <dt>Tuổi · cân nặng</dt><dd>{data.horse.age} tuổi · {data.horse.weightKg ?? '—'} kg</dd>
            <dt>Chủ ngựa</dt><dd>{data.owner}</dd>
            <dt>HLV phụ trách</dt><dd>{data.trainer}</dd>
            <dt>Khám trước thi đấu</dt><dd>{data.vetResult ? `${data.vetResult.pass ? 'ĐẠT' : 'KHÔNG ĐẠT'} · BS ${data.vetResult.by} · ${fmtDateTime(data.vetResult.at)}` : '—'}</dd>
            <dt>Lệ phí</dt><dd>{data.tournament.entryFee ? (data.paidAt ? `Đã nộp ${data.paidAt}` : 'Đã nộp') : 'Miễn phí'}</dd>
          </dl>
        </div>
      )}
    </Dialog>
  );
};
