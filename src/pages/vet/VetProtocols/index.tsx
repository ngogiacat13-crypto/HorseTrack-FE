import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isOpenProtocol, Protocol, stockShort, VET_ACTION_STATES, vetApi } from '../../../api/vetApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { money, PageHeader, Panel, Tabs } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ProtocolBadge } from '../../../components/vet/VetParts';

type Tab = 'act' | 'running' | 'closed';

/** What the vet has to do next for a protocol, in one short line. */
const nextStep = (p: Protocol) => {
  switch (p.state) {
    case 'DRAFT': return 'Hoàn thiện và gửi kho kiểm tồn';
    case 'STOCK_SHORTAGE': return `Thiếu ${stockShort(p).map((l) => `${l.name} ${l.short} ${l.unit}`).join(', ')} — đổi thuốc hoặc chờ`;
    case 'STOCK_AVAILABLE': return 'Kho đủ hàng — xem lại và xác nhận';
    case 'REQUIRES_VET_REVIEW': return 'Hàng trễ mốc — đánh giá lại ngựa';
    case 'IN_TREATMENT': return 'Ghi tiến triển / kết thúc điều trị';
    case 'WAITING_STOCK_CHECK': return 'Chờ kho phản hồi';
    case 'WAITING_RESTOCK': return `Chờ hàng về ${p.wait?.eta ?? ''}`;
    case 'READY_FOR_DISPENSING': return 'Chờ kho cấp phát';
    default: return '—';
  }
};

/* Danh sách phác đồ điều trị (2.1–2.7) — theo trạng thái cần xử lý. */
export const VetProtocols: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => vetApi.getProtocols());
  const [tab, setTab] = useState<Tab>('act');
  const protocols = useMemo(() => data?.protocols ?? [], [data]);
  const groups = useMemo(() => ({
    act: protocols.filter((p) => VET_ACTION_STATES.includes(p.state)),
    running: protocols.filter((p) => isOpenProtocol(p) && !VET_ACTION_STATES.includes(p.state)),
    closed: protocols.filter((p) => !isOpenProtocol(p)),
  }), [protocols]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const list = [...groups[tab]].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="ht ht-page">
      <PageHeader title="Phác đồ điều trị" sub="Bác sĩ lập phác đồ, gửi kho kiểm tồn và tự xác nhận — không qua Quản lý CLB duyệt (BR_07)."
        actions={<Link className="ht-btn ht-btn--primary" to="/vet/protocols/new"><Icon name="file" />Tạo phác đồ</Link>} />
      <Tabs<Tab> value={tab} onChange={setTab} items={[
        { value: 'act', label: 'Cần bác sĩ xử lý', count: groups.act.length },
        { value: 'running', label: 'Chờ kho / đang chờ hàng', count: groups.running.length },
        { value: 'closed', label: 'Đã đóng', count: groups.closed.length },
      ]} />
      <Panel>
        <div style={{ overflowX: 'auto' }}>
          <table className="ht-table">
            <thead><tr><th>Mã</th><th>Ngựa · chẩn đoán</th><th>Ca</th><th>Cần thuốc</th><th className="num">Chi phí</th><th>Trạng thái</th><th>Bước tiếp theo</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} tabIndex={0} onClick={() => navigate(`/vet/protocols/${p.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/vet/protocols/${p.id}`); }}>
                  <td className="id">{p.id}<span className="sub">v{p.version}</span></td>
                  <td><span className="strong">{p.horse}</span><span className="sub">{p.diagnosis}</span></td>
                  <td className="mono">#{p.caseId}</td>
                  <td className="mono">{p.requiredBy}</td>
                  <td className="num">{money(p.cost)}</td>
                  <td><ProtocolBadge state={p.state} delayed={p.delayed} /></td>
                  <td style={{ fontSize: 13 }}>{nextStep(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="ht-empty">Không có phác đồ ở mục này.</div>}
        </div>
      </Panel>
      {data.shipments.length > 0 && (
        <>
          <div style={{ height: 24 }} />
          <Panel title="Lô hàng liên quan" sub="Thông tin do Quản lý kho cập nhật — kho không tự đổi thuốc.">
            <table className="ht-table">
              <thead><tr><th>Lô</th><th>Mặt hàng</th><th>ETA</th><th>Cho</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {data.shipments.map((s) => (
                  <tr key={s.id}><td className="id">{s.id}</td><td className="strong">{s.item}</td>
                    <td className="mono">{s.etaOld && <s style={{ color: 'var(--muted)' }}>{s.etaOld}</s>} {s.eta}</td><td className="mono">{s.forRef}</td>
                    <td>{s.status === 'DELAYED' ? <span style={{ color: 'var(--danger-ink)', fontWeight: 600 }}>Trễ</span> : 'Đang vận chuyển'}</td></tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </>
      )}
    </div>
  );
};
