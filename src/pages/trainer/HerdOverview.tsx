import React, { useMemo, useState } from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { MOCK_HORSES } from '../../api/mockData';
import { HorseCard } from '../../components/ui/HorseCard';

export const TrainerHerdOverview: React.FC = () => {
  const [search, setSearch] = useState('');
  const [health, setHealth] = useState('all');
  const [locked, setLocked] = useState('all');
  const visibleHorses = useMemo(() => MOCK_HORSES.filter((horse) => {
    const matchesSearch = `${horse.name} ${horse.breed} ${horse.id}`.toLowerCase().includes(search.toLowerCase());
    const matchesHealth = health === 'all' || (health === 'healthy' ? horse.healthStatus === 'Healthy' : horse.healthStatus !== 'Healthy');
    const matchesLock = locked === 'all' || (locked === 'locked' ? horse.isLocked : !horse.isLocked);
    return matchesSearch && matchesHealth && matchesLock;
  }), [search, health, locked]);

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: '#1B4332' }}>Tổng quan đàn ngựa</h2>
          <p className="text-muted small mb-0">12 ngựa · 1 đang bị khóa tập · 9 có kế hoạch đang chạy</p>
        </div>
        <div className="d-flex gap-2"><Link to="/trainer/session-alert" className="btn btn-outline-danger">Phiên tập dừng</Link><Button variant="primary" style={{ backgroundColor: '#1B4332', borderColor: '#1B4332' }}>+ Tạo kế hoạch</Button></div>
      </div>

      <nav className="page-tabs mb-3"><span className="active">Tất cả 12</span><span>Khỏe mạnh 9</span><span>Theo dõi 2</span><span>Chấn thương 1</span></nav>
      <Row className="mb-4 g-3">
        <Col md={3}><Form.Select aria-label="Lọc trạng thái" value={health} onChange={(event) => setHealth(event.target.value)}><option value="all">Trạng thái: Tất cả</option><option value="healthy">Khỏe mạnh</option><option value="injured">Chấn thương / theo dõi</option></Form.Select></Col>
        <Col md={3}><Form.Select aria-label="Lọc khóa tập" value={locked} onChange={(event) => setLocked(event.target.value)}><option value="all">Khóa tập: Tất cả</option><option value="locked">Đang khóa</option><option value="normal">Bình thường</option></Form.Select></Col>
        <Col md={6}><Form.Control type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên ngựa..." /></Col>
      </Row>

      <Row className="g-4">
        {visibleHorses.map((horse) => (
          <Col md={6} lg={4} key={horse.id}><HorseCard horse={horse} /></Col>
        ))}
        {visibleHorses.length === 0 && <Col><div className="text-center text-muted p-5">Không tìm thấy ngựa phù hợp bộ lọc.</div></Col>}
      </Row>
      <div className="d-flex justify-content-between align-items-center mt-4 small text-muted"><span>Hiển thị {visibleHorses.length} trong {MOCK_HORSES.length} ngựa · Dữ liệu demo</span><div className="d-flex gap-2"><Button size="sm" variant="outline-secondary" disabled>‹</Button><Button size="sm" variant="primary">1</Button><Button size="sm" variant="outline-secondary">2</Button><Button size="sm" variant="outline-secondary">›</Button></div></div>
    </Container>
  );
};
