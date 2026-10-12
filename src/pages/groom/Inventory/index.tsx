import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Table } from 'react-bootstrap';

const stockItems = [
  { id: 'VT-0001', name: 'Cám ngựa', category: 'Thức ăn', quantity: 120, threshold: 50, unit: 'kg', last: '28/09/2026', arrival: '200 kg · 05/10/2026' },
  { id: 'VT-0002', name: 'Phenylbutazone 20%', category: 'Thuốc', quantity: 5, threshold: 20, unit: 'lọ', last: '25/09/2026', arrival: '30 lọ · 07/10/2026' },
  { id: 'VT-0003', name: 'Firocoxib 57 mg', category: 'Thuốc', quantity: 45, threshold: 30, unit: 'viên', last: '29/09/2026', arrival: 'Không có' },
  { id: 'VT-0004', name: 'Bông gạc', category: 'Vật tư', quantity: 8, threshold: 15, unit: 'cuộn', last: '26/09/2026', arrival: '50 cuộn · 18/10/2026' },
  { id: 'VT-0005', name: 'Cỏ khô', category: 'Thức ăn', quantity: 500, threshold: 100, unit: 'kg', last: '30/09/2026', arrival: 'Không có' },
];

export const Inventory: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const visibleItems = useMemo(() => stockItems.filter((item) => (
    (category === 'Tất cả' || item.category === category) &&
    `${item.name} ${item.id}`.toLowerCase().includes(query.toLowerCase())
  )), [category, query]);

  return (
    <Container fluid>
      <nav className="page-tabs mb-3"><span className="active">Tồn kho</span><span>Lô hàng sắp về</span><span>Kiểm kê tháng</span><span>Cảnh báo tồn kho</span><span>Yêu cầu nhập hàng</span><span>Ngưỡng an toàn</span></nav>
      <div className="d-flex justify-content-between align-items-start mb-3"><div><h2 className="fw-bold mb-1">Danh sách tồn kho</h2><p className="text-muted small mb-0">Theo dõi lượng tồn kho an toàn và các lô hàng dự kiến</p></div><Button>▣　Kiểm kê tháng</Button></div>
      <div className="row g-3 mb-3"><div className="col-md-4"><Card><Card.Body><strong className="fs-4 text-success me-3">5</strong><span>Mặt hàng đang theo dõi</span></Card.Body></Card></div><div className="col-md-4"><Card><Card.Body><strong className="fs-4 text-warning me-3">2</strong><span>Mặt hàng dưới ngưỡng an toàn</span></Card.Body></Card></div><div className="col-md-4"><Card><Card.Body><strong className="fs-4 me-3">3</strong><span>Lô hàng dự kiến sắp về</span></Card.Body></Card></div></div>
      <Alert variant="warning"><strong>ⓘ 2 cảnh báo dưới ngưỡng: Phenylbutazone và Bông gạc</strong><div className="small mt-1">Phenylbutazone còn 5/20 lọ; Bông gạc còn 8/15 cuộn. Lượng sắp về chỉ là dự kiến, chưa được ghi nhận vào tồn kho.</div></Alert>
      <div className="d-flex gap-2 flex-wrap mb-2"><Form.Select aria-label="Danh mục" value={category} onChange={(event) => setCategory(event.target.value)} style={{ maxWidth: 180 }}><option>Tất cả</option><option>Thức ăn</option><option>Thuốc</option><option>Vật tư</option></Form.Select><Form.Select aria-label="Trạng thái" style={{ maxWidth: 180 }}><option>Trạng thái: Tất cả</option><option>Đủ tồn</option><option>Dưới ngưỡng</option></Form.Select><Form.Control value={query} onChange={(event) => setQuery(event.target.value)} placeholder="⌕  Tìm tên hoặc mã vật tư..." style={{ maxWidth: 270 }} /></div>
      <Card className="mb-3"><div className="d-flex justify-content-between p-3 border-bottom"><strong>▣　Tồn kho hiện tại</strong><small className="text-muted">5 mặt hàng · Chỉ hàng đã nhận mới được sử dụng</small></div><Table responsive hover className="mb-0 align-middle"><thead><tr>{['Mặt hàng', 'Danh mục', 'Tồn hiện tại', 'Ngưỡng an toàn', 'Đơn vị', 'Nhập gần nhất', 'Sắp về / ngày dự kiến', 'Trạng thái', 'Thao tác'].map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id} className={item.quantity < item.threshold ? 'table-warning' : ''}><td><strong>{item.name}</strong><small className="d-block text-muted">{item.id}</small></td><td>{item.category}</td><td className={`fw-bold ${item.quantity < item.threshold ? 'text-warning' : ''}`}>{item.quantity}</td><td>{item.threshold}</td><td>{item.unit}</td><td>{item.last}</td><td>{item.arrival}</td><td><Badge bg={item.quantity < item.threshold ? 'warning' : 'success'} text={item.quantity < item.threshold ? 'dark' : undefined}>{item.quantity < item.threshold ? 'Dưới ngưỡng' : 'Đủ tồn'}</Badge></td><td><Button variant="link" className="p-0 text-success">Cập nhật tồn</Button></td></tr>)}</tbody></Table><div className="p-3 border-top small text-muted">Hiển thị {visibleItems.length}/{stockItems.length} mặt hàng · Ngày nhập gần nhất là dữ liệu minh họa</div></Card>
      <div className="row g-3"><div className="col-lg-8"><Card><Card.Body><strong>Yêu cầu nhập hàng tự động</strong><p className="text-muted small">Hệ thống tự tạo yêu cầu khi kiểm kê tháng, thiếu thuốc đặc biệt hoặc tồn dưới ngưỡng.</p>{stockItems.filter((item) => item.quantity < item.threshold).map((item) => <div className="info-pair py-2 border-top" key={item.id}><strong>{item.name}</strong><span>Tồn {item.quantity} {item.unit} &lt; ngưỡng {item.threshold} {item.unit}　<Badge bg="secondary">Tự tạo · Chỉ xem</Badge></span></div>)}</Card.Body></Card></div><div className="col-lg-4"><Card><Card.Body><strong>Quy tắc cập nhật kho</strong><p className="small mt-2">Cập nhật chỉ dành cho nhập, xuất và điều chỉnh tồn theo chứng từ. Không gửi yêu cầu nhập thủ công.</p><small className="text-muted">Phạm vi hiển thị: vật tư, số lượng và lô hàng.</small></Card.Body></Card></div></div>
      <div className="small text-muted mt-3">Kho vật tư · Dữ liệu trình diễn · Không bao gồm hồ sơ ngựa, huấn luyện hoặc hóa đơn</div>
    </Container>
  );
};
