import React from 'react';
import { Link } from 'react-router-dom';
import { ownerApi } from '../../../api/ownerApi';
import type { Registration } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, PageHeader, Panel, Timeline } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';

const STATUS: Record<Registration['status'], [string, 'warning' | 'success' | 'danger']> = { Pending: ['Chờ duyệt (PENDING_REVIEW)', 'warning'], Approved: ['Đã duyệt', 'success'], Rejected: ['Bị từ chối', 'danger'] };
const canResubmit = (r: Registration) => r.status === 'Rejected' && r.decidedNote === 'Cho phép nộp lại';

/* 1.4 Đăng ký ngựa mới — theo dõi trạng thái duyệt của Quản lý CLB (Flow 1). */
export const OwnerRegistrations: React.FC = () => {
  const actor = useActor();
  const { data, loading, error, reload } = useFetch(() => ownerApi.getMyRegistrations(actor), [actor]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;

  return (
    <div className="ht ht-page">
      <PageHeader title="Đăng ký ngựa mới" sub="Gửi hồ sơ ngựa và giấy tờ — Quản lý CLB kiểm tra checklist rồi duyệt hoặc từ chối"
        actions={<Link className="ht-btn ht-btn--primary" to={PATH.owner.registrationCreate}><Icon name="file" size={16} />Tạo hồ sơ mới</Link>} />
      <div style={{ display: 'grid', gap: 16 }}>
        {data.map((r) => {
          const decision = r.history.find((h) => h.tone === 'danger' || h.tone === 'success');
          return (
            <Panel key={r.id} title={<>{r.horse.name} · <span className="ht-mono">{r.id}</span></>} sub={`${r.horse.breed} · ${r.horse.sex === '♂' ? 'Đực' : 'Cái'} · ${r.horse.age} tuổi · gửi ${r.submittedAt}`}
              right={<Badge tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</Badge>}>
              <div className="ht-panel__body ht-grid-2" style={{ gap: 20 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <b style={{ fontSize: 13 }}>Checklist của Quản lý CLB ({r.checklist.filter((c) => c.passed).length}/{r.checklist.length})</b>
                  {r.checklist.map((c) => (
                    <div key={c.key} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <Icon name={c.passed ? 'check' : r.status === 'Pending' ? 'clock' : 'x'} size={15} />
                      <span><b>{c.label}</b><br /><small style={{ color: 'var(--muted)' }}>{c.detail}</small></span>
                    </div>
                  ))}
                  {r.status === 'Rejected' && decision && <Callout tone="danger" title="Lý do từ chối">{decision.text.replace(/^từ chối( · cho phép nộp lại)?: /, '')}</Callout>}
                  {canResubmit(r) && <Link className="ht-btn ht-btn--secondary ht-btn--sm" style={{ justifySelf: 'start' }} to={`${PATH.owner.registrationCreate}?from=${r.id}`}><Icon name="refresh" size={14} />Bổ sung & nộp lại</Link>}
                  {r.status === 'Approved' && <Callout tone="success">Ngựa đã được đưa vào danh sách quản lý của CLB.</Callout>}
                </div>
                <div>
                  <b style={{ fontSize: 13 }}>Diễn biến</b>
                  <Timeline items={r.history.slice(0, 5).map((h) => ({ tone: h.tone, what: <><b>{h.who}</b> {h.text}</>, when: h.at }))} />
                </div>
              </div>
            </Panel>
          );
        })}
        {data.length === 0 && <div className="ht-empty">Bạn chưa gửi hồ sơ nào.</div>}
      </div>
    </div>
  );
};
