import React, { useMemo, useState } from 'react';
import { InventoryItem, vetApi } from '../../../api/vetApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Callout, money, PageHeader, Panel } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { useDebounce } from '../../../hooks/useDebounce';

const avail = (i: InventoryItem) => Math.max(0, i.onHand - i.held);
const days = (h: number) => (h % 24 === 0 ? `${h / 24} ngày` : `${h} giờ`);

/* Danh mục thuốc & vật tư — tra cứu khi lập phác đồ. Số tồn do Quản lý kho cập nhật; bác sĩ chỉ xem. */
export const VetMedicines: React.FC = () => {
  const { data, loading, error, reload } = useFetch(() => vetApi.getMedicines());
  const [group, setGroup] = useState('');
  const [q, setQ] = useState('');
  const query = useDebounce(q); // filter after the user pauses typing
  const [flag, setFlag] = useState<'' | 'detect' | 'rx' | 'low'>('');

  const items = useMemo(() => data ?? [], [data]);
  const groups = useMemo(() => [...new Set(items.map((i) => i.group))], [items]);
  const list = useMemo(() => items.filter((i) =>
    (!group || i.group === group) &&
    (!flag || (flag === 'detect' ? !!i.detectionHours : flag === 'rx' ? i.rx : avail(i) < i.safety)) &&
    `${i.name} ${i.brand ?? ''} ${i.note ?? ''} ${i.id}`.toLowerCase().includes(query.trim().toLowerCase())), [items, group, flag, query]);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const shown = groups.filter((g) => list.some((i) => i.group === g));

  return (
    <div className="ht ht-page">
      <PageHeader title="Danh mục thuốc & vật tư" sub={`${items.length} mặt hàng · ${groups.length} nhóm · tra cứu khi lập phác đồ`} />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <select className="ht-select" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Nhóm thuốc">
          <option value="">Nhóm: Tất cả</option>{groups.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select className="ht-select" value={flag} onChange={(e) => setFlag(e.target.value as typeof flag)} aria-label="Lọc">
          <option value="">Lọc: Tất cả</option>
          <option value="detect">Có thời gian phát hiện (thi đấu)</option>
          <option value="rx">Thuốc kê đơn</option>
          <option value="low">Dưới ngưỡng an toàn</option>
        </select>
        <div className="ht-search-input" style={{ flex: 1, minWidth: 220 }}><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm hoạt chất, biệt dược, mã…" aria-label="Tìm thuốc" /></div>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {shown.map((g) => (
          <Panel key={g} title={g} sub={`${list.filter((i) => i.group === g).length} mặt hàng`}>
            <div style={{ overflowX: 'auto' }}>
              <table className="ht-table">
                <thead><tr><th>Hoạt chất / mặt hàng</th><th>Đường dùng</th><th>Liều tham khảo</th><th>Phát hiện khi thi đấu</th><th className="num">Đơn giá</th><th className="num">Khả dụng</th></tr></thead>
                <tbody>
                  {list.filter((i) => i.group === g).map((i) => (
                    <tr key={i.id}>
                      <td>
                        <span className="strong">{i.name}</span>
                        <span className="sub">{i.brand && <>VD biệt dược: {i.brand} · </>}{i.note && <>{i.note} · </>}<span className="ht-mono">{i.id}</span></span>
                        <span style={{ display: 'inline-flex', gap: 4, marginTop: 4 }}>
                          {i.rx && <Badge tone="info" plain>Kê đơn</Badge>}
                          {i.controlled && <Badge tone="danger" plain>Thuốc kiểm soát</Badge>}
                        </span>
                      </td>
                      <td>{i.route}</td>
                      <td style={{ fontSize: 13 }}>{i.doseRef ?? '—'}</td>
                      <td>{i.detectionHours ? <Badge tone="warning">~{days(i.detectionHours)}</Badge> : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                      <td className="num ht-mono">{money(i.unitPrice)}<span className="sub">/{i.unit}</span></td>
                      <td className="num" style={{ color: avail(i) < i.safety ? 'var(--warning-ink)' : undefined }}><b>{avail(i)}</b> {i.unit}{i.held > 0 && <span className="sub">giữ {i.held}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ))}
        {shown.length === 0 && <Panel><div className="ht-empty">Không có mặt hàng phù hợp.</div></Panel>}
      </div>

      <Callout tone="demo" icon="info" title="Dữ liệu tham khảo cho demo" style={{ marginTop: 24 }}>
        Liều là liều tham khảo trong tài liệu thú y — liều thực tế do bác sĩ quyết định theo từng ca. “Phát hiện khi thi đấu” lấy theo danh sách FEI Detection Times 2022;
        mỗi giải/cơ quan quản lý có quy định riêng. Giá là giá ước tính để trình diễn.
      </Callout>
    </div>
  );
};
