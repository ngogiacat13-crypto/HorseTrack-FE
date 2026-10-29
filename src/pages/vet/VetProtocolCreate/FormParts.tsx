import React from 'react';
import { ProtoPhase, protoCost, VetCase, VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Callout, money, Panel } from '../../../components/ui/Ht';

const selectStyle: React.CSSProperties = { height: 44, width: '100%', fontSize: 14 };

interface HorseCaseProps {
  horses: VetHorse[]; cases: VetCase[]; locked: boolean;
  horseId: string; caseId: string; diagnosis: string; requiredBy: string;
  emergency: boolean; onHorse: (id: string) => void; onCase: (id: string) => void; onDiagnosis: (v: string) => void; onRequiredBy: (v: string) => void; onEmergency: (v: boolean) => void;
}

export const HorseCaseFields: React.FC<HorseCaseProps> = ({ horses, cases, locked, horseId, caseId, diagnosis, requiredBy, emergency, onHorse, onCase, onDiagnosis, onRequiredBy, onEmergency }) => (
  <Panel title="Ngựa & chẩn đoán">
    <div className="ht-panel__body ht-proto-phase__grid" style={{ gridTemplateColumns: 'minmax(170px, 1.2fr) minmax(200px, 1.4fr) minmax(0, 2fr) minmax(140px, 1fr)' }}>
      <div className="ht-field">
        <label className="ht-label" htmlFor="pc-horse">Ngựa<span className="ht-req">*</span></label>
        <select id="pc-horse" className="ht-select" style={selectStyle} value={horseId} disabled={locked} onChange={(e) => onHorse(e.target.value)}>
          <option value="">— Chọn ngựa —</option>
          {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div className="ht-field">
        <label className="ht-label" htmlFor="pc-case">Ca khám<span className="ht-req">*</span>{emergency && <span className="ht-hint"> · bắt buộc khi cấp cứu</span>}</label>
        <select id="pc-case" className="ht-select" style={selectStyle} value={caseId} disabled={!horseId} onChange={(e) => onCase(e.target.value)} required={emergency || undefined} aria-required>
          <option value="">{horseId ? '— Chọn ca —' : 'Chọn ngựa trước'}</option>
          {cases.map((c) => <option key={c.id} value={c.id} disabled={!c.exam}>#{c.id} · {c.type}{!c.exam ? ' — chưa khám' : ''}</option>)}
        </select>
        {emergency && !caseId && <small className="ht-hint" style={{ color: 'var(--danger-ink)' }}>Phác đồ cấp cứu phải chọn ca khám.</small>}
      </div>
      <div className="ht-field">
        <label className="ht-label" htmlFor="pc-dx">Chẩn đoán<span className="ht-req">*</span></label>
        <input id="pc-dx" className="ht-input" value={diagnosis} onChange={(e) => onDiagnosis(e.target.value)} />
      </div>
      <div className="ht-field">
        <label className="ht-label" htmlFor="pc-req">Ngày cần thuốc</label>
        <input id="pc-req" className="ht-input ht-mono" value={requiredBy} onChange={(e) => onRequiredBy(e.target.value)} placeholder="dd/mm/yyyy" />
      </div>
      <label className="ht-field" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, gridColumn: '1 / -1' }}>
        <input id="pc-emergency" data-testid="protocol-emergency" type="checkbox" checked={emergency} onChange={(e) => onEmergency(e.target.checked)} />
        <span><b className="ht-label" style={{ display: 'block', margin: 0 }}>Trạng thái cấp cứu</b><small className="ht-hint">Kho được cấp thuốc/vật tư ngay, không chờ chủ ngựa thanh toán.</small></span>
      </label>
    </div>
  </Panel>
);

interface SummaryProps {
  horse?: VetHorse; vetCase?: VetCase; phases: ProtoPhase[]; error: string; busy: '' | 'send';
  onSend: () => void;
}

export const SummaryPanel: React.FC<SummaryProps> = ({ horse, vetCase, phases, error, busy, onSend }) => (
  <>
    <Panel as="h3" title="Tóm tắt phác đồ">
      <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
        <dl className="ht-kv" style={{ gridTemplateColumns: '100px 1fr' }}>
          <dt>Ngựa</dt><dd>{horse ? horse.name : '—'}</dd>
          <dt>Ca khám</dt><dd className="ht-mono">{vetCase ? vetCase.id : '—'}</dd>
          <dt>Khóa tập</dt><dd>{horse ? (horse.trainingLocked ? <b style={{ color: 'var(--danger-ink)' }}>ĐANG KHÓA</b> : 'Không') : '—'}</dd>
          <dt>Số giai đoạn</dt><dd>{phases.length}</dd>
        </dl>
        <dl className="ht-sum">
          {phases.map((p, i) => <React.Fragment key={i}><dt>Giai đoạn {i + 1}</dt><dd className="ht-mono">{money(protoCost([p]))}</dd></React.Fragment>)}
          <dt style={{ alignSelf: 'center', color: 'var(--foreground)', fontWeight: 600 }}>Tổng chi phí</dt><dd className="total">{money(protoCost(phases))}</dd>
        </dl>
        {error && <Callout tone="danger">{error}</Callout>}
        <button type="button" className="ht-btn ht-btn--primary ht-btn--block" data-testid="protocol-send-btn" onClick={onSend} disabled={!!busy}>
          {busy === 'send' ? 'Đang gửi…' : <>Gửi kiểm tra tồn kho <Icon name="arrow" /></>}
        </button>
      </div>
    </Panel>
    <Callout tone="info" title="Không cần Quản lý CLB duyệt" icon="info">
      Kho chỉ kiểm tồn, giữ hàng và cấp phát. Sau khi kho phản hồi, bạn tự xác nhận phác đồ (BR_07).
    </Callout>
  </>
);
