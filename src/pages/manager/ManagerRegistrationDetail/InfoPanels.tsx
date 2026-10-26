import React, { useState } from 'react';
import { managerApi, type Registration } from '../../../api/managerApi';
import type { ApiError } from '../../../api/http';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, Panel, Timeline, TimelineItem } from '../../../components/ui/Ht';

const twoCols: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' };

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
      </dl>
    </div>
  </Panel>
);

export const OwnerInfo: React.FC<{ reg: Registration }> = ({ reg: d }) => (
  <Panel title="Chủ ngựa">
    <div className="ht-panel__body">
      <dl className="ht-kv">
        <dt>Họ và tên</dt><dd>{d.owner.fullName}</dd>
        <dt>Email</dt><dd>{d.owner.email}</dd>
        <dt>Điện thoại</dt><dd className="ht-mono">{d.owner.phone}</dd>
      </dl>
    </div>
  </Panel>
);

const shortFileName = (name: string, max = 32) => {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  const base = dot > 0 ? name.slice(0, dot) : name;
  const keep = max - ext.length - 1;
  return `${base.slice(0, Math.ceil(keep * 0.6))}…${base.slice(-Math.floor(keep * 0.4))}${ext}`;
};

export const Attachments: React.FC<{ reg: Registration }> = ({ reg: d }) => {
  const [error, setError] = useState('');
  const [opening, setOpening] = useState<number | null>(null);
  const open = async (id: number) => {
    setError('');
    setOpening(id);
    try {
      await managerApi.openAttachment(id);
    } catch (e) {
      setError((e as ApiError).message ?? 'Không mở được tệp.');
    } finally {
      setOpening(null);
    }
  };
  return (
    <Panel as="h3" title="Tệp đính kèm" right={<span className="ht-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{d.attachments.length} tệp</span>}>
      <div className="ht-panel__body" style={{ paddingBottom: 12 }}>
        {error && <Callout tone="danger" style={{ marginBottom: 10 }}>{error}</Callout>}
        {!d.attachments.length && <p className="ht-muted" data-testid="attachments-empty" style={{ margin: 0 }}>Chủ ngựa chưa đính kèm giấy tờ nào cho hồ sơ này.</p>}
        {d.attachments.map((a) => (
          <div key={a.beId ?? a.name} className="ht-doc">
            <span className="ht-doc__icon" style={a.problem ? { color: 'var(--danger-ink)', borderColor: 'var(--danger-line)', background: 'var(--danger-soft)' } : undefined}><Icon name="file" /></span>
            <div className="ht-doc__body">
              <div className="ht-doc__name">{a.name}</div>
              {a.file && <div className="ht-doc__file" title={a.file} data-testid="attachment-file-name">{shortFileName(a.file)}</div>}
              <div className="ht-doc__meta">{a.meta}</div>
            </div>
            {a.beId !== undefined && (
              <button type="button" className="ht-btn ht-btn--ghost ht-btn--sm" data-testid={`view-attachment-${a.beId}`} disabled={opening === a.beId} onClick={() => open(a.beId!)}>
                <Icon name="eye" size={14} />{opening === a.beId ? 'Đang mở…' : 'Xem'}
              </button>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
};

export const RegistrationHistory: React.FC<{ items: TimelineItem[] }> = ({ items }) => (
  <Panel as="h3" title="Lịch sử hồ sơ" right={<Badge tone="neutral" plain style={{ fontFamily: 'var(--font-mono)' }}>BR_10</Badge>}>
    <div className="ht-panel__body"><Timeline items={items} /></div>
  </Panel>
);
