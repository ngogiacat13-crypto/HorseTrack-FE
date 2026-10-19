import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ownerApi, type NewRegistration } from '../../../api/ownerApi';
import type { Registration } from '../../../api/managerApi';
import { useActor, useAuth } from '../../../auth/AuthContext';
import { useAction } from '../../../hooks/useAction';
import { useFetch } from '../../../hooks/useFetch';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, Callout, PageHeader, Panel, Segmented } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { DocUpload } from './DocUpload';

const EMPTY: NewRegistration = {
  name: '', breed: '', sex: '♂', age: 3, color: '', height: '', weight: 0, passport: '', healthCert: '',
  phone: '', taxCode: '', billingAddress: '', files: { ownership: null, health: null },
};
/** Prefill from a rejected file (documents must be uploaded again). */
const fromReg = (r: Registration): NewRegistration => ({
  ...EMPTY, name: r.horse.name, breed: r.horse.breed, sex: r.horse.sex === '♀' ? '♀' : '♂', age: r.horse.age,
  color: r.horseExtra.color, height: r.horseExtra.height, weight: r.horseExtra.weight,
  passport: r.horseExtra.passport, healthCert: r.horseExtra.healthCert, phone: r.owner.phone, taxCode: r.ownerExtra.taxCode, billingAddress: r.ownerExtra.billingAddress,
});

/* 1.4 Tạo hồ sơ đăng ký ngựa (Flow 1, bước 1–2) — hoặc nộp lại hồ sơ bị từ chối khi được phép. */
export const OwnerRegistrationCreate: React.FC = () => {
  const actor = useActor();
  const [params] = useSearchParams();
  const from = params.get('from');
  const { data, loading, error, reload } = useFetch(() => (from ? ownerApi.getMyRegistration(from, actor) : Promise.resolve(null)), [from, actor]);
  if (from && !data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  return <RegistrationForm key={from ?? 'new'} resubmit={data ?? undefined} />;
};

const RegistrationForm: React.FC<{ resubmit?: Registration }> = ({ resubmit }) => {
  const actor = useActor();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { busy, error, setError, run } = useAction();
  const [f, setF] = useState<NewRegistration>(() => (resubmit ? fromReg(resubmit) : EMPTY));
  const set = <K extends keyof NewRegistration>(k: K, v: NewRegistration[K]) => setF((x) => ({ ...x, [k]: v }));
  const setFile = (k: keyof NewRegistration['files']) => (d: NewRegistration['files'][typeof k]) => setF((x) => ({ ...x, files: { ...x.files, [k]: d } }));
  const text = (k: 'name' | 'breed' | 'color' | 'height' | 'passport' | 'healthCert' | 'phone' | 'taxCode' | 'billingAddress', label: string, ph: string, req = true) => (
    <div className="ht-field" style={{ margin: 0 }}>
      <label className="ht-label" htmlFor={`rg-${k}`}>{label}{req && <span className="ht-req">*</span>}</label>
      <input id={`rg-${k}`} className={`ht-input${k === 'phone' ? ' ht-mono' : ''}`} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(() => ownerApi.submitRegistration(f, { ...actor, email: user?.email }, resubmit), resubmit ? 'Đã nộp lại hồ sơ — chờ Quản lý CLB duyệt.' : 'Đã gửi hồ sơ — chờ Quản lý CLB duyệt.')) navigate(PATH.owner.registrations);
  };

  return (
    <div className="ht ht-page">
      <PageHeader crumbs={<BackButton fallback={PATH.owner.registrations} />} title={resubmit ? `Nộp lại hồ sơ ${resubmit.id}` : 'Tạo hồ sơ đăng ký ngựa'}
        sub="Hệ thống kiểm tra trường bắt buộc rồi chuyển hồ sơ sang PENDING_REVIEW cho Quản lý CLB" />
      {resubmit && <Callout tone="info" title="Hồ sơ được phép nộp lại" style={{ marginBottom: 16 }}>Thông tin cũ đã được điền sẵn — bổ sung giấy tờ còn thiếu và tải lại toàn bộ tệp.</Callout>}
      <form onSubmit={submit} className="ht-cols">
        <div>
          <Panel title="1. Thông tin ngựa">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
              <div className="ht-grid-2" style={{ gap: 14 }}>{text('name', 'Tên ngựa', 'VD: Red Comet')}{text('breed', 'Giống', 'VD: Thoroughbred')}</div>
              <div className="ht-grid-2" style={{ gap: 14 }}>
                <div className="ht-field" style={{ margin: 0 }}><span className="ht-label">Giới tính</span>
                  <Segmented<'♂' | '♀'> label="Giới tính" value={f.sex} onChange={(v) => set('sex', v)} items={[{ value: '♂', label: 'Đực' }, { value: '♀', label: 'Cái' }]} /></div>
                <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="rg-age">Tuổi<span className="ht-req">*</span></label>
                  <input id="rg-age" className="ht-input" inputMode="numeric" value={f.age || ''} onChange={(e) => set('age', Number(e.target.value))} /></div>
              </div>
              <div className="ht-grid-2" style={{ gap: 14 }}>{text('color', 'Màu lông', 'VD: Bay (nâu đỏ)')}{text('height', 'Chiều cao', 'VD: 16.2 hands', false)}</div>
              <div className="ht-grid-2" style={{ gap: 14 }}>
                <div className="ht-field" style={{ margin: 0 }}><label className="ht-label" htmlFor="rg-weight">Cân nặng (kg)</label>
                  <input id="rg-weight" className="ht-input" inputMode="numeric" value={f.weight || ''} onChange={(e) => set('weight', Number(e.target.value))} placeholder="VD: 480" /></div>
                {text('passport', 'Số hộ chiếu ngựa', 'VD: VN-PP-2026-0020')}
              </div>
              {text('healthCert', 'Nơi cấp / hạn giấy sức khỏe', 'VD: Chi cục Thú y TP.HCM · hết hạn 08/2027', false)}
            </div>
          </Panel>
          <Panel title="2. Giấy tờ" sub="PDF, JPG hoặc PNG · tối đa 10 MB mỗi tệp">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
              <DocUpload id="doc-own" label="Giấy tờ sở hữu" hint="Hợp đồng mua bán / giấy chứng nhận sở hữu" required value={f.files.ownership} onChange={setFile('ownership')} onError={setError} />
              <DocUpload id="doc-health" label="Giấy chứng nhận sức khỏe" hint="Còn hiệu lực, do cơ quan thú y cấp" required value={f.files.health} onChange={setFile('health')} onError={setError} />
            </div>
          </Panel>
        </div>
        <div>
          <Panel as="h3" title="3. Chủ ngựa & thanh toán">
            <div className="ht-panel__body" style={{ display: 'grid', gap: 14 }}>
              <dl className="ht-kv"><dt>Họ tên</dt><dd>{actor.name}</dd><dt>Email</dt><dd>{user?.email || '—'}</dd></dl>
              {text('phone', 'Số điện thoại', '0912345678')}
              {text('taxCode', 'Mã số thuế', 'Không bắt buộc', false)}
              {text('billingAddress', 'Địa chỉ nhận hóa đơn', 'Số nhà, đường, quận, tỉnh/thành')}
            </div>
          </Panel>
          {error && <Callout tone="danger">{error}</Callout>}
          <button type="submit" className="ht-btn ht-btn--primary" disabled={busy}><Icon name="send" size={16} />{busy ? 'Đang gửi…' : resubmit ? 'Nộp lại hồ sơ' : 'Gửi hồ sơ cho Quản lý CLB'}</button>
          <Callout tone="info" title="Sau khi gửi">Quản lý CLB kiểm tra danh tính, giấy tờ sở hữu và giấy sức khỏe. Từ chối luôn kèm lý do; có thể được phép nộp lại.</Callout>
        </div>
      </form>
    </div>
  );
};
