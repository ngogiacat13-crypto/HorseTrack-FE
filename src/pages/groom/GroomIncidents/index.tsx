import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { groomApi } from '../../../api/groomApi';
import { CASE_LABEL, SEVERITY_LABEL } from '../../../api/vetApi';
import { useActor } from '../../../auth/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { Badge, Callout, PageHeader, Panel } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { IncidentForm } from './IncidentForm';

/* 4.1–4.2 Báo cáo sự cố + danh sách báo cáo của tôi (trạng thái do Bác sĩ cập nhật). */
export const GroomIncidents: React.FC = () => {
  const actor = useActor();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => groomApi.getReports(actor), [actor]);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const open = data.cases.filter((c) => c.status !== 'CLOSED').length;

  return (
    <div className="ht ht-page">
      <PageHeader title="Báo cáo sự cố" sub={`Ngựa trong ${data.groom.zones.join(', ')} · gửi thẳng vào hộp thư ca khám của Bác sĩ thú y`}
        actions={<Badge tone={open ? 'warning' : 'neutral'}>{open} ca đang mở</Badge>} />
      <div className="ht-cols">
        <Panel title="Gửi báo cáo mới">
          <div className="ht-panel__body">
            <IncidentForm horses={data.horses} initialHorse={params.get('horse') ?? ''} onDone={reload} />
          </div>
        </Panel>
        <div>
          <Panel as="h3" title="Báo cáo của tôi" sub={`${data.cases.length} báo cáo`}>
            <div className="ht-panel__body" style={{ display: 'grid', gap: 12 }}>
              {data.cases.map((c) => (
                <div key={c.id} className="ht-report">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <b><span className="ht-mono">{c.id}</span> · {c.horse}</b>
                    <Badge tone={CASE_LABEL[c.status][1]}>{CASE_LABEL[c.status][0]}</Badge>
                  </div>
                  <div style={{ fontSize: 13 }}>{c.type} · mức độ <Badge tone={SEVERITY_LABEL[c.severity][1]} plain>{SEVERITY_LABEL[c.severity][0]}</Badge></div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{c.note}</div>
                  <small className="ht-mono" style={{ color: 'var(--muted)' }}>{c.at}{c.protocolId ? ` · phác đồ ${c.protocolId}` : ''}</small>
                </div>
              ))}
              {data.cases.length === 0 && <div className="ht-empty">Chưa có báo cáo.</div>}
            </div>
          </Panel>
          <Callout tone="info" title="Sau khi gửi">Bác sĩ thú y tiếp nhận, khám và có thể khóa huấn luyện (BR_01). Mã phu chỉ xem trạng thái ca — không xem hồ sơ khám chi tiết.</Callout>
        </div>
      </div>
    </div>
  );
};
