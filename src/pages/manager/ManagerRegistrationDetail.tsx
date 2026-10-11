import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { managerApi, Registration } from '../../api/managerApi';
import { useActor } from '../../auth/AuthContext';
import { Icon } from '../../components/ui/Icon';
import { Badge, Dialog, Loading, PageHeader, Panel, ReasonField, Timeline, TimelineItem, useToast } from '../../components/ui/Ht';

export const ManagerRegistrationDetail: React.FC = () => {
  const { id = 'REG-0019' } = useParams<{ id: string }>();
  const toast = useToast();
  const actor = useActor();
  const [d, setD] = useState<Registration | null>(null);
  const [checks, setChecks] = useState<Registration['checklist']>([]);
  const [decision, setDecision] = useState<null | { kind: 'Approved' | 'Rejected'; at: string }>(null);
  const [history, setHistory] = useState<TimelineItem[]>([]);
  const [dlg, setDlg] = useState<null | 'approve' | 'reject'>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const [allowResubmit, setAllowResubmit] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    managerApi.getRegistration(id).then((r) => {
      setD(r);
      setChecks(r.checklist);
      setHistory(r.history.map((h) => ({ tone: h.tone, what: <><b>{h.who}</b> {h.text}</>, when: h.at })));
      if (r.status !== 'Pending') setDecision({ kind: r.status as 'Approved' | 'Rejected', at: r.decidedNote ?? '' });
    });
  }, [id]);

  if (!d) return <div className="ht ht-page"><Loading /></div>;

  const passed = checks.filter((c) => c.passed).length;
  const allPassed = passed === checks.length;
  const failed = checks.filter((c) => !c.passed);
  const locked = !!decision;

  const setCheck = (key: string, ok: boolean) =>
    setChecks((cs) => cs.map((c) => (c.key === key ? { ...c, passed: ok, detail: ok && !c.passed ? 'Đã kiểm tra thủ công.' : c.detail } : c)));

  const finish = (kind: 'Approved' | 'Rejected', line: React.ReactNode) => {
    setDecision({ kind, at: '03/10 10:31' });
    setHistory((h) => [{ tone: kind === 'Approved' ? 'success' : 'danger', what: line, when: '03/10 10:31' }, ...h]);
    setDlg(null);
  };

  const approve = async () => {
    setBusy(true);
    try {
      await managerApi.approveRegistration(d, checks, note, actor);
      finish('Approved', <><b>{actor.name}</b> phê duyệt · chuyển <span className="ht-mono">APPROVED</span>{note && <>: “{note}”</>}</>);
      toast(`Đã phê duyệt ${d.id} — ${d.horse.name} được thêm vào danh sách quản lý.`);
    } finally { setBusy(false); }
  };

  const reject = async () => {
    if (reason.trim().length < 10) { setReasonErr('Lý do từ chối phải có ít nhất 10 ký tự.'); return; }
    setBusy(true);
    try {
      await managerApi.rejectRegistration(d, checks, reason.trim(), allowResubmit, actor);
      finish('Rejected', <><b>{actor.name}</b> từ chối{allowResubmit ? ' · cho phép nộp lại' : ''}: “{reason.trim()}”</>);
      toast(`Đã từ chối ${d.id} và gửi lý do cho chủ ngựa.`);
    } finally { setBusy(false); }
  };

  const statusBadge = decision?.kind === 'Approved' ? <Badge tone="success">Đã duyệt</Badge>
    : decision?.kind === 'Rejected' ? <Badge tone="danger">Đã từ chối</Badge>
    : <Badge tone="info">Chờ duyệt</Badge>;

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<><Link className="ht-back" to="/manager/registrations"><Icon name="back" size={14} />Đăng ký ngựa</Link><Icon name="chev" size={14} /><b className="ht-mono">{d.id}</b></>}
        title={d.horse.name}
        badge={statusBadge}
        sub={<>Hồ sơ <span className="ht-mono">{d.id}</span> · gửi bởi {d.owner.fullName} lúc <span className="ht-mono">{d.submittedAt}</span>{d.status === 'Pending' && <> · đã chờ {d.waitingDays} ngày</>}</>}
        actions={locked
          ? <span style={{ fontSize: 13, color: 'var(--muted)' }}>Đã xử lý <span className="ht-mono">{decision!.at}</span></span>
          : <>
              <button type="button" className="ht-btn ht-btn--secondary" style={{ color: 'var(--danger-ink)' }} onClick={() => { setReasonErr(''); setDlg('reject'); }}><Icon name="x" />Từ chối</button>
              <button type="button" className="ht-btn ht-btn--primary" disabled={!allPassed} aria-describedby="approve-why" onClick={() => setDlg('approve')}><Icon name="check" />Phê duyệt</button>
            </>}
      />

      <div className="ht-cols">
        <div>
          <Panel
            title="Checklist xét duyệt"
            sub={<span id="approve-why">{allPassed ? 'Tất cả mục đã đạt — có thể phê duyệt.' : `Chỉ phê duyệt khi cả ${checks.length} mục đều đạt. Còn ${checks.length - passed} mục chưa đạt.`}</span>}
            right={<Badge tone={allPassed ? 'success' : 'warning'} plain>{passed}/{checks.length} đạt</Badge>}
          >
            <div className="ht-panel__body">
              <ul className="ht-checks">
                {checks.map((c) => (
                  <li key={c.key} className="ht-checkrow" data-state={c.passed ? 'pass' : 'fail'}>
                    <span className="ht-checkrow__icon"><Icon name={c.passed ? 'check' : 'x'} /></span>
                    <div><b>{c.label}</b><small>{c.detail}</small></div>
                    <div className="ht-seg" role="group" aria-label={c.label}>
                      <button type="button" aria-pressed={c.passed} disabled={locked} onClick={() => setCheck(c.key, true)}>Đạt</button>
                      <button type="button" aria-pressed={!c.passed} disabled={locked} onClick={() => setCheck(c.key, false)}>Không đạt</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel title="Thông tin ngựa" right={<Badge tone="neutral" plain>Khai báo bởi chủ ngựa</Badge>}>
            <div className="ht-panel__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <dl className="ht-kv">
                <dt>Tên ngựa</dt><dd>{d.horse.name}</dd>
                <dt>Giống</dt><dd>{d.horse.breed}</dd>
                <dt>Giới tính · tuổi</dt><dd>{d.horse.sex === '♂' ? 'Đực' : 'Cái'} · {d.horse.age} tuổi</dd>
                <dt>Màu lông</dt><dd>{d.horseExtra.color}</dd>
                <dt>Chiều cao</dt><dd>{d.horseExtra.height}</dd>
              </dl>
              <dl className="ht-kv">
                <dt>Cân nặng</dt><dd>{d.horseExtra.weight} kg</dd>
                <dt>Mã ngựa</dt><dd className="ht-mono">{d.horse.code}</dd>
                <dt>Microchip</dt><dd className="ht-mono">{d.horseExtra.microchip}</dd>
                <dt>Hộ chiếu</dt><dd className="ht-mono">{d.horseExtra.passport}</dd>
                <dt>GCN sức khỏe</dt><dd>{d.horseExtra.healthCert}</dd>
              </dl>
            </div>
          </Panel>

          <Panel title="Chủ ngựa">
            <div className="ht-panel__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <dl className="ht-kv">
                <dt>Họ và tên</dt><dd>{d.owner.fullName}</dd>
                <dt>Email</dt><dd>{d.owner.email}</dd>
                <dt>Điện thoại</dt><dd className="ht-mono">{d.owner.phone}</dd>
              </dl>
              <dl className="ht-kv">
                <dt>Mã số thuế</dt><dd className="ht-mono">{d.ownerExtra.taxCode}</dd>
                <dt>Địa chỉ</dt><dd>{d.ownerExtra.billingAddress}</dd>
                <dt>Ngựa đang gửi</dt><dd>{d.ownerExtra.otherHorses}</dd>
              </dl>
            </div>
          </Panel>
        </div>

        <div>
          <Panel as="h3" title="Tệp đính kèm" right={<span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{d.attachments.length} tệp</span>}>
            <div className="ht-panel__body" style={{ paddingBottom: 12 }}>
              {d.attachments.map((a) => (
                <div key={a.name} className="ht-doc">
                  <span className="ht-doc__icon" style={a.problem ? { color: 'var(--danger-ink)', borderColor: 'var(--danger-line)', background: 'var(--danger-soft)' } : undefined}><Icon name="file" /></span>
                  <div><div className="ht-doc__name">{a.name}</div><div className="ht-doc__meta">{a.meta}</div></div>
                  <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm">Xem</button>
                </div>
              ))}
            </div>
          </Panel>
          <Panel as="h3" title="Lịch sử hồ sơ" right={<Badge tone="neutral" plain style={{ fontFamily: 'var(--font-mono)' }}>BR_10</Badge>}>
            <div className="ht-panel__body"><Timeline items={history} /></div>
          </Panel>
        </div>
      </div>

      <Dialog open={dlg === 'approve'} onClose={() => setDlg(null)} icon="check" tone="brand"
        title={`Phê duyệt ${d.horse.name}?`}
        sub={<>Hồ sơ chuyển <span className="ht-mono">APPROVED</span>, ngựa được thêm vào danh sách quản lý và chủ ngựa nhận thông báo.</>}
        confirmLabel="Xác nhận phê duyệt" onConfirm={approve} busy={busy}>
        <label className="ht-label" htmlFor="ap-note" style={{ display: 'block', marginBottom: 6 }}>Ghi chú (không bắt buộc)</label>
        <textarea id="ap-note" className="ht-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Đã đối chiếu microchip tại chuồng A-03." />
      </Dialog>

      <Dialog open={dlg === 'reject'} onClose={() => setDlg(null)} icon="x" tone="danger" danger
        title={`Từ chối hồ sơ ${d.id}`} sub={`Lý do được gửi nguyên văn cho ${d.owner.fullName} và lưu vào nhật ký.`}
        confirmLabel="Xác nhận từ chối" onConfirm={reject} busy={busy}>
        <ReasonField id="rj-reason" label="Lý do từ chối" value={reason} placeholder="Tối thiểu 10 ký tự" error={reasonErr}
          onChange={(v) => { setReason(v); if (v.trim().length >= 10) setReasonErr(''); }} />
        {failed.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {failed.map((c) => (
              <button key={c.key} type="button" className="ht-badge ht-badge--neutral ht-badge--plain" style={{ cursor: 'pointer', height: 26 }}
                onClick={() => { const v = (reason ? reason + '\n' : '') + `${c.label}: ${c.detail}`; setReason(v); setReasonErr(''); }}>
                + {c.label}
              </button>
            ))}
          </div>
        )}
        <label className="ht-check" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={allowResubmit} onChange={(e) => setAllowResubmit(e.target.checked)} /> Cho phép chủ ngựa sửa và nộp lại
        </label>
      </Dialog>
    </div>
  );
};
