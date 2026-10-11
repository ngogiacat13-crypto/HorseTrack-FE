import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ApiError } from '../../api/http';
import { dateKey, isOpenProtocol, protoCost, stockShort, vetApi } from '../../api/vetApi';
import { useActor } from '../../auth/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Icon } from '../../components/ui/Icon';
import { Badge, Callout, Dialog, money, PageHeader, Panel, ReasonField, Timeline, useToast } from '../../components/ui/Ht';
import { HorseBadges, LoadState } from '../../components/trainer/TrainerParts';
import { ProtocolBadge, ProtocolPath } from '../../components/vet/VetParts';

type Action = 'send' | 'cancel' | 'wait' | 'confirm' | 'progress' | 'complete';

/* Chi tiết phác đồ: 2.3 phản hồi kho · 2.4 thiếu thuốc → đổi / chờ · 2.5 xác nhận · 2.6 hàng trễ · 2.7 theo dõi kết quả */
export const VetProtocolDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actor = useActor();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => vetApi.getProtocol(id), [id]);
  const [action, setAction] = useState<Action | null>(null);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { protocol: p, horse, vetCase, versions, shipments } = data;
  const short = stockShort(p);
  const stockComplete = !!p.stock && short.length === 0;
  const etaLate = p.wait && dateKey(p.wait.eta) > dateKey(p.requiredBy);
  const open = (a: Action) => { setAction(a); setText(''); setErr(''); };

  const run = async () => {
    if (!action) return;
    setBusy(true);
    try {
      const msgs: Record<Action, [() => Promise<unknown>, string]> = {
        send: [() => vetApi.sendStockCheck(p, actor), `${p.id} đã gửi kho kiểm tồn.`],
        cancel: [() => vetApi.cancelDraft(p, actor), `Đã hủy bản nháp ${p.id}.`],
        wait: [() => vetApi.waitRestock(p, text, actor), `${p.id}: chờ hàng về.`],
        confirm: [() => vetApi.confirmProtocol(p, text, actor), `${p.id} đã xác nhận — kho chuẩn bị cấp phát.`],
        progress: [() => vetApi.addProgress(p, text, actor), 'Đã ghi tiến triển.'],
        complete: [() => vetApi.completeProtocol(p, text, actor), `${p.id} đã kết thúc điều trị.`],
      };
      await msgs[action][0]();
      toast(msgs[action][1]);
      setAction(null);
      reload();
    } catch (e) {
      setErr((e as ApiError).message ?? 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const dialogs: Record<Action, { title: string; sub?: string; label: string; field?: [string, string, number?]; danger?: boolean }> = {
    send: { title: `Gửi ${p.id} cho kho kiểm tồn`, sub: p.replaces ? `Khi gửi, ${p.replaces} chuyển SUPERSEDED và không được cấp phát.` : 'Kho đối chiếu tồn, lô/hạn dùng và phản hồi đủ hoặc thiếu kèm ETA.', label: 'Gửi kiểm tồn' },
    cancel: { title: `Hủy bản nháp ${p.id}`, label: 'Hủy bản nháp', danger: true },
    wait: {
      title: 'Chờ hàng về', label: 'Chọn chờ hàng',
      sub: `Hàng thiếu dự kiến về ${short.map((l) => l.eta).filter(Boolean).join(', ') || '—'}; mốc cần thuốc ${p.requiredBy}.`,
      field: [etaLate || short.some((l) => l.eta && dateKey(l.eta) > dateKey(p.requiredBy)) ? 'Đánh giá chờ vẫn an toàn về chuyên môn' : 'Ghi chú', 'VD: Ngựa ổn định, chườm lạnh thay thế đến khi hàng về.', short.some((l) => l.eta && dateKey(l.eta) > dateKey(p.requiredBy)) ? 15 : 10],
    },
    confirm: { title: `Xác nhận phác đồ ${p.id}`, sub: 'Kho đã đủ khả năng cấp. Xác nhận phác đồ vẫn phù hợp với tình trạng ngựa hiện tại.', label: 'Xác nhận & chuyển kho cấp phát', field: ['Đánh giá tính phù hợp', 'VD: Đã khám lại, tình trạng không đổi, giữ nguyên liều.'] },
    progress: { title: 'Ghi tiến triển điều trị', label: 'Lưu tiến triển', field: ['Tiến triển', 'VD: Giảm sưng, đi lại tốt hơn, nhiệt độ bình thường.'] },
    complete: { title: `Kết thúc điều trị ${p.id}`, sub: 'Ghi kết quả và chỉ định tiếp theo. Mở khóa huấn luyện (nếu đủ điều kiện) làm riêng ở hồ sơ ngựa.', label: 'Kết thúc điều trị', field: ['Kết quả & chỉ định tiếp theo', 'VD: Hết sưng, tái khám sau 2 tuần, tập nhẹ 1 tuần đầu.'] },
  };
  const dlg = action ? dialogs[action] : null;

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/vet/protocols"><Icon name="back" size={14} />Phác đồ điều trị</Link><Icon name="chev" size={14} /><b>{p.id}</b></>}
        title={<>Phác đồ <span className="ht-mono">{p.id}</span> <span style={{ color: 'var(--muted)', fontWeight: 500 }}>/ {horse.name}</span></>}
        badge={<ProtocolBadge state={p.state} delayed={p.delayed} />}
        sub={<>{p.diagnosis} · ca <Link to={`/vet/cases?case=${p.caseId}`} className="ht-mono">#{p.caseId}</Link> · phiên bản {p.version}{p.replaces && <> (thay <Link to={`/vet/protocols/${p.replaces}`} className="ht-mono">{p.replaces}</Link>)</>} · BS {p.vet} · lập {p.createdAt}</>}
        actions={<Link className="ht-btn ht-btn--secondary" to={`/vet/horses/${horse.id}`}><Icon name="heart" />Hồ sơ sức khỏe</Link>}
      />

      <div style={{ marginBottom: 20 }}><ProtocolPath protocol={p} /></div>

      {p.state === 'SUPERSEDED' && (
        <div className="ht-banner ht-banner--info"><Icon name="info" /><div><b>Phác đồ này đã bị thay bằng <Link to={`/vet/protocols/${p.supersededBy}`} className="ht-mono">{p.supersededBy}</Link>.</b><p>Kho không cấp phát theo bản đã bị thay thế.</p></div></div>
      )}
      {(p.state === 'REQUIRES_VET_REVIEW' || (p.delayed && isOpenProtocol(p) && p.state !== 'READY_FOR_DISPENSING')) && (
        <div className="ht-banner" role="alert">
          <Icon name="truck" />
          <div>
            <b>{p.state === 'REQUIRES_VET_REVIEW' ? 'Cảnh báo lô hàng trễ — cần đánh giá lại ngựa (2.6).' : 'Đang chờ hàng về sau mốc cần thuốc.'}</b>
            <p>Cần thuốc từ <span className="ht-mono">{p.requiredBy}</span>, hàng dự kiến về <span className="ht-mono">{p.wait?.eta ?? '—'}</span>. {p.state === 'REQUIRES_VET_REVIEW' ? 'Chọn: sửa phác đồ (phiên bản mới), hoặc tiếp tục chờ nếu vẫn an toàn.' : `BS đã đánh giá: ${p.wait?.note ?? ''}`}</p>
          </div>
        </div>
      )}

      <div className="ht-cols">
        <div>
          {p.phases.map((ph) => (
            <section key={ph.no} className="ht-proto-phase">
              <div className="ht-proto-phase__head">
                <span className="ht-phase__no">{String(ph.no).padStart(2, '0')}</span>
                <h3>Giai đoạn {ph.no} · {ph.name}</h3>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Bắt đầu <span className="ht-mono">{ph.startDate}</span> · {ph.days} ngày{ph.goal && ` · ${ph.goal}`}</span>
                <b className="ht-mono" style={{ fontSize: 14 }}>{money(protoCost([ph]))}</b>
              </div>
              {ph.items.length > 0 && (
                <div className="ht-proto-phase__body">
                  <table className="ht-proto-items">
                    <thead><tr><th>Thuốc / vật tư</th><th className="num">Số lượng</th><th className="num">Đơn giá</th><th className="num">Thành tiền</th></tr></thead>
                    <tbody>{ph.items.map((it) => <tr key={it.itemId}><td><b>{it.name}</b></td><td className="num">{it.qty} {it.unit}</td><td className="num ht-mono">{money(it.unitPrice)}</td><td className="num"><b>{money(it.qty * it.unitPrice)}</b></td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          <Panel title={<><Icon name="box" /> Phản hồi kho</>} sub={p.stock ? `Cập nhật ${p.stock.at} bởi ${p.stock.by} · so với ngày cần thuốc ${p.requiredBy}` : undefined}>
            {p.stock ? (
              <>
                <table className="ht-table">
                  <thead><tr><th>Vật tư</th><th className="num">Cần</th><th className="num">Có thể cấp</th><th className="num">Đã giữ</th><th>Lô · hạn dùng</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {p.stock.lines.map((l) => (
                      <tr key={l.itemId}>
                        <td className="strong">{l.name}</td><td className="num">{l.need} {l.unit}</td>
                        <td className="num" style={{ color: l.short ? 'var(--danger-ink)' : undefined }}>{l.available}</td><td className="num">{l.held}</td>
                        <td className="mono">{l.lot ? `${l.lot} · ${l.expiry}` : '—'}</td>
                        <td>{l.short > 0
                          ? <Badge tone="danger">Thiếu {l.short}{l.eta && ` · ETA ${l.eta.slice(0, 5)}`}</Badge>
                          : <Badge tone="success">Đủ</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shipments.map((s) => <div key={s.id} style={{ padding: '10px 24px', fontSize: 13, borderTop: '1px solid var(--border)' }}><Icon name="truck" size={14} /> Lô <span className="ht-mono">{s.id}</span> · {s.item} · ETA {s.etaOld && <s>{s.etaOld}</s>} <b>{s.eta}</b> {s.status === 'DELAYED' && <Badge tone="danger" plain>Trễ</Badge>}</div>)}
              </>
            ) : <div className="ht-empty">{p.state === 'DRAFT' ? 'Chưa gửi kho.' : 'Kho đang kiểm tra tồn — chờ phản hồi.'}</div>}
          </Panel>

          {(p.state === 'IN_TREATMENT' || p.progress.length > 0 || p.outcome) && (
            <Panel title="Theo dõi kết quả điều trị" right={p.state === 'IN_TREATMENT' && <button type="button" className="ht-more" onClick={() => open('progress')}>Ghi tiến triển <Icon name="arrow" /></button>}>
              <div className="ht-panel__body">
                {p.outcome && <Callout tone="success" title="Kết quả" style={{ marginBottom: 12 }}>{p.outcome}</Callout>}
                {p.progress.length ? <Timeline items={p.progress.map((g) => ({ tone: 'info', what: <><b>{g.by}</b> — {g.text}</>, when: g.at }))} />
                  : <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Chưa có ghi nhận tiến triển.</p>}
              </div>
            </Panel>
          )}
        </div>

        <div>
          <Panel as="h3" title="Quyết định của bác sĩ">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
              <dl className="ht-kv" style={{ gridTemplateColumns: '100px 1fr' }}>
                <dt>Ngựa</dt><dd><Link to={`/vet/horses/${horse.id}`}>{horse.name}</Link> <HorseBadges horse={horse} compact /></dd>
                <dt>Chẩn đoán</dt><dd>{vetCase?.exam?.diagnosis ?? p.diagnosis}</dd>
                <dt>Cần thuốc</dt><dd className="ht-mono">{p.requiredBy}</dd>
                <dt>Tổng chi phí</dt><dd><b>{money(p.cost)}</b></dd>
              </dl>
              {p.state === 'DRAFT' && <>
                <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => open('send')}><Icon name="send" />Gửi kiểm tra tồn kho</button>
                <button type="button" className="ht-btn ht-btn--ghost ht-btn--block" onClick={() => open('cancel')}>Hủy bản nháp</button>
              </>}
              {p.state === 'WAITING_STOCK_CHECK' && <Callout tone="info" icon="clock">Đang chờ Quản lý kho đối chiếu tồn. Bạn sẽ nhận thông báo khi có phản hồi.</Callout>}
              {(p.state === 'STOCK_SHORTAGE' || p.state === 'REQUIRES_VET_REVIEW') && <>
                <Callout tone="danger" icon="warn" title={p.state === 'STOCK_SHORTAGE' ? 'Kho báo thiếu vật tư' : 'Cần đánh giá lại'}>
                  {short.map((l) => <div key={l.itemId}>{l.name}: thiếu {l.short} {l.unit}{l.eta ? ` · về ${l.eta}` : ' · chưa có ETA'}</div>)}
                </Callout>
                <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => navigate(`/vet/protocols/new?replace=${p.id}`)}><Icon name="refresh" />Đổi thuốc — tạo phiên bản mới</button>
                <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" onClick={() => open('wait')}><Icon name="clock" />{p.state === 'REQUIRES_VET_REVIEW' ? 'Tiếp tục chờ hàng' : 'Chờ nhập hàng'}</button>
                {stockComplete && <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" onClick={() => open('confirm')}><Icon name="check" />Hàng đã đủ — xác nhận</button>}
              </>}
              {p.state === 'WAITING_RESTOCK' && <>
                <Callout tone={etaLate ? 'danger' : 'info'} icon="truck">Chờ hàng về <b>{p.wait?.eta}</b>{etaLate && ` — sau mốc cần thuốc ${p.requiredBy}`}. Khi kho nhập hàng, bạn rà soát lại rồi xác nhận.</Callout>
                {stockComplete
                  ? <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => open('confirm')}><Icon name="check" />Hàng đã về — rà soát & xác nhận</button>
                  : <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" onClick={() => navigate(`/vet/protocols/new?replace=${p.id}`)}><Icon name="refresh" />Đổi thuốc — tạo phiên bản mới</button>}
              </>}
              {p.state === 'STOCK_AVAILABLE' && <>
                <Callout tone="success" icon="check">Kho xác nhận đủ hàng và đã giữ số lượng cần thiết. Xem lại tình trạng ngựa rồi tự xác nhận — không cần Quản lý CLB duyệt.</Callout>
                <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => open('confirm')}><Icon name="check" />Xác nhận phác đồ</button>
                <button type="button" className="ht-btn ht-btn--ghost ht-btn--block" onClick={() => navigate(`/vet/protocols/new?replace=${p.id}`)}>Sửa phác đồ (phiên bản mới)</button>
              </>}
              {p.state === 'READY_FOR_DISPENSING' && <Callout tone="success" icon="box">Đã xác nhận. Quản lý kho chuẩn bị và cấp phát theo phác đồ này; trạng thái chuyển “Đang điều trị” khi cấp xong.</Callout>}
              {p.state === 'IN_TREATMENT' && <>
                <button type="button" className="ht-btn ht-btn--secondary ht-btn--block" onClick={() => open('progress')}><Icon name="pulse" />Ghi tiến triển</button>
                <button type="button" className="ht-btn ht-btn--primary ht-btn--block" onClick={() => open('complete')}><Icon name="check" />Kết thúc điều trị</button>
              </>}
              {!isOpenProtocol(p) && p.state !== 'SUPERSEDED' && <Callout tone="info">Phác đồ đã đóng.</Callout>}
            </div>
          </Panel>

          {versions.length > 1 && (
            <Panel as="h3" title="Các phiên bản">
              <div className="ht-panel__body" style={{ display: 'grid', gap: 8 }}>
                {versions.map((v) => (
                  <Link key={v.id} to={`/vet/protocols/${v.id}`} className="ht-row-between" style={{ fontSize: 13, padding: '8px 10px', background: v.id === p.id ? 'var(--primary-soft)' : 'var(--bg)', borderRadius: 8, color: 'inherit', textDecoration: 'none' }}>
                    <span><b className="ht-mono">{v.id}</b> · v{v.version}</span><ProtocolBadge state={v.state} />
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          <Panel as="h3" title="Lịch sử phác đồ">
            <div className="ht-panel__body">
              <Timeline items={p.log.map((l) => ({ tone: l.tone === 'warning' ? 'warning' : l.tone, what: <><b>{l.who}</b> {l.text}</>, when: l.at }))} />
            </div>
          </Panel>
        </div>
      </div>

      <Dialog open={!!dlg} onClose={() => setAction(null)} icon={action === 'cancel' ? 'x' : action === 'wait' ? 'clock' : 'check'} tone={dlg?.danger ? 'danger' : 'brand'} danger={dlg?.danger}
        busy={busy} title={dlg?.title} sub={dlg?.sub} confirmLabel={dlg?.label ?? ''} onConfirm={run}>
        {err && <Callout tone="danger" style={{ marginBottom: dlg?.field ? 14 : 0 }}>{err}</Callout>}
        {dlg?.field && <ReasonField id="pd-text" label={dlg.field[0]} value={text} onChange={setText} placeholder={dlg.field[1]} min={dlg.field[2] ?? 10} />}
      </Dialog>
    </div>
  );
};
