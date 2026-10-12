import React from 'react';
import type { Registration } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Panel, Timeline, TimelineItem } from '../../../components/ui/Ht';

const twoCols: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' };

/** Horse details as declared by the owner. */
export const HorseInfo: React.FC<{ reg: Registration }> = ({ reg: d }) => (
  <Panel title="Thông tin ngựa" right={<Badge tone="neutral" plain>Khai báo bởi chủ ngựa</Badge>}>
    <div className="ht-panel__body" style={twoCols}>
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
);

export const OwnerInfo: React.FC<{ reg: Registration }> = ({ reg: d }) => (
  <Panel title="Chủ ngựa">
    <div className="ht-panel__body" style={twoCols}>
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
);

export const Attachments: React.FC<{ reg: Registration }> = ({ reg: d }) => (
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
);

/** 1.4 — history of the file (BR_10). */
export const RegistrationHistory: React.FC<{ items: TimelineItem[] }> = ({ items }) => (
  <Panel as="h3" title="Lịch sử hồ sơ" right={<Badge tone="neutral" plain style={{ fontFamily: 'var(--font-mono)' }}>BR_10</Badge>}>
    <div className="ht-panel__body"><Timeline items={items} /></div>
  </Panel>
);
