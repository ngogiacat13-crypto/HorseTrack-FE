import React, { useState } from 'react';
import { Badge, Card, Col, Container, Form, Row } from 'react-bootstrap';

const stalls = [
  { id: 'A-01', horse: 'Galaxy', status: 'Sạch', zone: 'Khu A' },
  { id: 'A-02', horse: 'Storm', status: 'Cần dọn', zone: 'Khu A' },
  { id: 'A-03', horse: 'Bolt', status: 'Sạch', zone: 'Khu A' },
  { id: 'A-04', horse: 'Trống', status: 'Bảo trì', zone: 'Khu A' },
  { id: 'A-05', horse: 'Star', status: 'Sạch', zone: 'Khu A' },
  { id: 'B-01', horse: 'Thunder', status: 'Sạch', zone: 'Khu B' },
  { id: 'B-02', horse: 'Flash', status: 'Sạch', zone: 'Khu B' },
  { id: 'B-03', horse: 'Wind', status: 'Cần dọn', zone: 'Khu B' },
  { id: 'B-04', horse: 'Spirit', status: 'Sạch', zone: 'Khu B' },
  { id: 'B-05', horse: 'Arrow', status: 'Sạch', zone: 'Khu B' },
];

export const StableMap: React.FC = () => {
  const [selectedId, setSelectedId] = useState('A-02');
  const [search, setSearch] = useState('');
  const selected = stalls.find((stall) => stall.id === selectedId) ?? stalls[0];
  const visible = stalls.filter((stall) => `${stall.id} ${stall.horse}`.toLowerCase().includes(search.toLowerCase()));
  const statusClass = (status: string) => status === 'Sạch' ? 'success' : status === 'Cần dọn' ? 'warning' : 'danger';

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-start mb-3"><div><div className="page-tabs mb-3"><span>Công việc hôm nay</span><span className="active">Sơ đồ chuồng</span><span>Danh sách công việc</span><span>Báo cáo sự cố</span><span>Báo cáo vật tư</span></div><h2 className="fw-bold mb-1">Sơ đồ chuồng trại</h2><p className="text-muted small mb-0">Thứ Bảy, 03/10/2026 · Khu A và Khu B · Thông tin chăm sóc được phân công</p></div><Badge bg="light" text="dark">● 10 chuồng</Badge></div>
      <Row className="g-3 mb-3">
        {[['10', 'Tổng số chuồng', 'success'], ['7', 'Sạch', 'success'], ['2', 'Cần dọn', 'warning'], ['1', 'Bảo trì', 'danger']].map(([n, label, color]) => <Col sm={6} xl={3} key={label}><Card><Card.Body className="d-flex align-items-center gap-3"><strong className={`fs-4 text-${color}`}>{n}</strong><span className="small">{label}</span></Card.Body></Card></Col>)}
      </Row>
      <Row className="g-2 mb-3">
        <Col md={3}><Form.Select aria-label="Khu chuồng"><option>Khu chuồng: Tất cả</option><option>Khu A</option><option>Khu B</option></Form.Select></Col>
        <Col md={3}><Form.Select aria-label="Trạng thái"><option>Trạng thái: Tất cả</option><option>Sạch</option><option>Cần dọn</option><option>Bảo trì</option></Form.Select></Col>
        <Col md={4}><Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="⌕  Tìm mã chuồng hoặc tên ngựa..." /></Col>
        <Col md={2} className="d-flex justify-content-end align-items-center small"><span className="text-success">● Sạch</span>&nbsp; <span className="text-warning">● Cần dọn</span>&nbsp; <span className="text-danger">● Bảo trì</span></Col>
      </Row>
      <Row className="g-3">
        <Col xl={8}>
          {['Khu A', 'Khu B'].map((zone) => <Card className="mb-3" key={zone}><Card.Body><strong>{zone}</strong><div className="text-muted small mb-3">5 chuồng · {zone === 'Khu A' ? '3 sạch · 1 cần dọn · 1 bảo trì' : '4 sạch · 1 cần dọn'}</div><Row className="g-2">{visible.filter((stall) => stall.zone === zone).map((stall) => <Col sm={6} lg key={stall.id}><button type="button" onClick={() => setSelectedId(stall.id)} className={`stall-tile ${selectedId === stall.id ? 'selected' : ''}`}><div className="d-flex justify-content-between"><strong>{stall.id}</strong><span className={`text-${statusClass(stall.status)}`}>{stall.status === 'Sạch' ? '♙' : stall.status === 'Cần dọn' ? '⚒' : '⚠'}</span></div><strong className="d-block mt-2">{stall.horse}</strong><Badge bg={statusClass(stall.status)} className="mt-2">{stall.status}</Badge><small>{selectedId === stall.id ? 'Đang xem chi tiết' : 'Thông tin chăm sóc'}</small></button></Col>)}</Row></Card.Body></Card>)}
        </Col>
        <Col xl={4}>
          <Card className="mb-3"><Card.Body><strong>Chi tiết chuồng đang xem</strong><p className="text-muted small">Thông tin chỉ đọc</p><div className="d-flex justify-content-between mb-2"><h4>{selected.id}<br /><small>{selected.horse}</small></h4><Badge bg={statusClass(selected.status)} className="align-self-start">{selected.status}</Badge></div><div className="info-pair"><span>Khu chuồng</span><strong>{selected.zone}</strong></div><div className="info-pair"><span>Người được giao</span><strong>Phạm Văn Toàn</strong></div><div className="info-pair"><span>Công việc</span><strong>Dọn chuồng</strong></div><div className="info-pair"><span>Ca chăm sóc</span><strong>Sáng · 03/10/2026</strong></div></Card.Body></Card>
          <Card className="mb-3"><Card.Body><strong>Chỉ dẫn công việc</strong><p className="small text-muted mb-2">Dọn chuồng {selected.id} — {selected.horse}</p>{['Thay lớp lót bẩn, thu gom vào vị trí quy định.', 'Làm sạch máng ăn và kiểm tra nước uống.', 'Giữ lối đi khô, không để vật tư cản cửa chuồng.'].map((item, i) => <div className="small mb-2" key={item}><Badge bg="light" text="dark">{i + 1}</Badge>　{item}</div>)}</Card.Body></Card>
          <div className="small p-3 rounded border border-danger-subtle bg-danger-subtle text-danger"><strong>A-04 đang bảo trì</strong><br />Chuồng trống, tạm ngưng sử dụng. Không bố trí ngựa vào chuồng cho đến khi bảo trì hoàn tất.</div>
        </Col>
      </Row>
      <div className="text-muted small mt-3">Hiển thị {visible.length}/10 chuồng · Đang xem {selected.id} · Dữ liệu trình diễn</div>
    </Container>
  );
};
