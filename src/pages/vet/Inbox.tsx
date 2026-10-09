import React, { useState } from 'react';
import { Badge, Button, Card, Container, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const cases = [
  { id: 'C-0015', horse: 'Galaxy', source: '⚡ Dừng phiên', type: 'Nghi chấn thương', level: 'Cao', date: '03/10' },
  { id: 'C-0014', horse: 'Bolt', source: '⚠ Mã phụ báo', type: 'Đau bụng', level: 'Trung bình', date: '02/10' },
  { id: 'C-0013', horse: 'Star', source: '⚠ Mã phụ báo', type: 'Chán ăn', level: 'Thấp', date: '01/10' },
  { id: 'C-0012', horse: 'Storm', source: '⚡ Dừng phiên', type: 'Chấn thương chân', level: 'Đã khóa', date: '27/09' },
];

export const VetInbox: React.FC = () => {
  const [selected, setSelected] = useState(cases[0]);
  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-start mb-3"><div><h2 className="fw-bold mb-1">Hộp thư ca khám</h2><p className="text-muted small mb-0">Ca từ phiên tập bị dừng và báo cáo sự cố của Mã phụ.</p></div><Button variant="outline-secondary" size="sm">☷　Lọc: Tất cả nguồn　⌄</Button></div>
      <nav className="page-tabs mb-3"><span className="active">Mới 3</span><span>Đang theo dõi 2</span><span>Đã xử lý 14</span></nav>
      <div className="vet-inbox-grid">
        <Card className="align-self-start"><Table responsive hover className="mb-0 align-middle">
          <thead><tr>{['Ca', 'Ngựa', 'Nguồn', 'Loại', 'Mức độ', 'Ngày'].map((item) => <th key={item}>{item}</th>)}</tr></thead>
          <tbody>{cases.map((item) => <tr onClick={() => setSelected(item)} key={item.id} className={`case-row ${selected.id === item.id ? 'selected' : ''}`}><td className="font-monospace">{item.id}</td><td className="fw-semibold">{item.horse}</td><td className={item.source.includes('Dừng') ? 'text-danger' : 'text-warning'}>{item.source}</td><td>{item.type}</td><td><Badge bg={item.level === 'Cao' ? 'danger' : item.level === 'Thấp' ? 'success' : 'warning'}>{item.level}</Badge></td><td>{item.date}</td></tr>)}</tbody>
        </Table><div className="p-3 text-muted small border-top">4 ca · cập nhật lúc 10:30　 <span className="float-end">⟳ Tự làm mới</span></div></Card>
        <Card><Card.Body><div className="d-flex justify-content-between"><small className="text-muted">Ca khám #{selected.id}</small><Badge bg="primary">Chờ xử lý</Badge></div><h4 className="fw-bold mt-2">{selected.horse}</h4><p className="text-muted small">Thoroughbred · 4 tuổi · Chủ: Hoàng Thị Lan</p><hr /><div className="info-pair"><span>Nguồn</span><strong>Phiên tập #S-0023 dừng do vượt ngưỡng</strong></div><div className="info-pair mt-2"><span>Mức độ</span><strong className="text-danger">{selected.level}</strong></div><div className="info-pair mt-2"><span>Người gửi</span><strong>Trần Đức Hùng · 10:26</strong></div><div className="case-description mt-3"><small className="text-muted">MÔ TẢ</small><p className="small mb-0">Nhịp tim 195 bpm (ngưỡng 180). Thở gấp sau vòng thứ 3, bước chân trước phải hơi ngắn — nghi chấn thương chân.</p></div><div className="d-flex gap-2 mt-3"><div className="metric-box danger flex-fill"><small>Nhịp tim max</small><div className="fw-bold text-danger">195</div></div><div className="metric-box flex-fill"><small>Tốc độ max</small><div className="fw-bold">52 <small>km/h</small></div></div></div>        <div className="d-grid gap-2 mt-3"><Button variant="outline-secondary">⊙　Tiếp tục theo dõi</Button><Button variant="danger">▣　Khóa huấn luyện</Button><Link to="/vet/protocols/new" className="btn btn-primary">♧　Tạo phác đồ điều trị</Link></div><div className="text-muted small mt-3">ⓘ Khóa huấn luyện chặn mọi lịch tập của ngựa và thông báo HLV trưởng.</div></Card.Body></Card>
      </div>
    </Container>
  );
};
