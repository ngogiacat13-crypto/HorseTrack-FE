import React, { useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { MOCK_TASKS } from '../../../api/mockData';

const extraTasks = [
  { id: 't4', title: 'Cho ăn chiều', horseName: 'Bolt', time: '12:00', status: 'Pending' as const, type: 'Feeding', description: '2 kg cám + 1 kg cỏ khô' },
  { id: 't5', title: 'Chườm lạnh', horseName: 'Galaxy · A-01', time: '14:00', status: 'Pending' as const, type: 'Care', description: 'Theo dõi theo chỉ định bác sĩ thú y' },
  { id: 't6', title: 'Dọn chuồng', horseName: 'Thunder · A-04', time: '08:00', status: 'Completed' as const, type: 'MuckingOut', description: 'Vệ sinh chuồng và thay lớp lót' },
];
const tasks = [...MOCK_TASKS, ...extraTasks];

export const GroomTodayTasks: React.FC = () => {
  const [completed, setCompleted] = useState<string[]>(tasks.filter((task) => task.status === 'Completed').map((task) => task.id));
  const [filter, setFilter] = useState('all');
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'all' || (filter === 'done' ? completed.includes(task.id) : !completed.includes(task.id))), [filter, completed]);
  const pendingCount = tasks.length - completed.length;

  return (
    <Container fluid>
      <div className="groom-page-tabs"><span className="active">▣　Công việc hôm nay <Badge bg="warning" text="dark">{pendingCount}</Badge></span><Link to="/groom/stable">▦　Sơ đồ chuồng</Link><span>☷　Danh sách công việc</span><span>ⓘ　Báo cáo sự cố</span><span>▧　Báo cáo vật tư</span></div>
      <div className="d-flex justify-content-between align-items-start mt-3 mb-3"><div><h2 className="fw-bold mb-1">Công việc hôm nay</h2><p className="text-muted small mb-0">Thứ Bảy, 03/10/2026 · Khu A</p></div><div className="d-flex gap-2"><Badge bg="light" text="dark">{tasks.length} việc</Badge><Badge bg="success">{completed.length} xong</Badge><Badge bg="danger">{tasks.filter((task) => task.status === 'Overdue' && !completed.includes(task.id)).length} quá hạn</Badge></div></div>
      <nav className="page-tabs mb-3">{[['all', 'Tất cả'], ['todo', 'Chờ làm'], ['done', 'Đã hoàn thành']].map(([key, label]) => <button key={key} type="button" className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}</button>)}<span>Chải lông</span><span>Chuồng lạnh</span></nav>
      {tasks.some((task) => task.status === 'Overdue' && !completed.includes(task.id)) && <Alert variant="danger" className="py-2"><strong>⚠　Phiên tập #S-0023 (Galaxy) đã dừng lúc 10:23 ngày 02/10/2026 — vượt ngưỡng an toàn.</strong><div className="small">Không tiếp tục cho ăn. Đã ghi nhận ca khám; chờ hướng dẫn từ bác sĩ.</div></Alert>}
      <div className="d-grid gap-2">
        {visibleTasks.map((task) => {
          const isDone = completed.includes(task.id);
          const tone = isDone ? 'success' : task.status === 'Overdue' ? 'danger' : task.id === 't2' ? 'warning' : '';
          return <Card key={task.id} className={`task-card ${tone}`}>
            <Card.Body className="py-3">
              <div className="d-flex align-items-start gap-3">
                <Form.Check type="checkbox" aria-label={`Đánh dấu hoàn thành: ${task.title}`} checked={isDone} onChange={(event) => setCompleted((current) => event.target.checked ? [...current, task.id] : current.filter((id) => id !== task.id))} />
                <div className="flex-grow-1"><div className="d-flex justify-content-between gap-2"><div><strong>{task.title} — {task.horseName}</strong><div className="task-meta">◷　{task.time}　·　{isDone ? '✓ Hoàn thành lúc 06:28' : task.status === 'Overdue' ? <span className="text-danger">Quá hạn 52 phút</span> : task.status === 'Pending' ? <span>Còn 8 phút</span> : 'Theo lịch'}</div><small className="text-muted">Khẩu phần / ghi chú: {task.description}</small></div><Badge bg={isDone ? 'success' : task.status === 'Overdue' ? 'danger' : task.id === 't2' ? 'warning' : 'secondary'} text={!isDone && task.id === 't2' ? 'dark' : undefined}>{isDone ? 'XONG' : task.status === 'Overdue' ? 'QUÁ HẠN' : task.id === 't2' ? 'SẮP HẠN' : 'CHỜ'}</Badge></div>
                  {!isDone && task.id === 't2' && <div className="task-warning mt-2">ⓘ Storm đang trong khóa huấn luyện, cần xác nhận từ bác sĩ trước khi tiếp tục chăm sóc vận động.</div>}
                </div>
              </div>
            </Card.Body>
          </Card>;
        })}
      </div>
      <div className="small text-muted text-center mt-4">Trạng thái công việc cập nhật cục bộ trong phiên demo.</div>
      <Row className="g-2 mt-2">{[['ⓘ', 'Báo cáo sự cố', 'Tạo báo cáo khi ngựa có triệu chứng'], ['▣', 'Báo cáo vật tư', 'Ghi nhận vật tư sử dụng'], ['▤', 'Lịch huấn luyện', 'Xem lịch phiên tập hôm nay']].map(([icon, title, hint]) => <Col md={4} key={title}><Card><Card.Body className="py-2"><strong>{icon}　{title}</strong><small className="d-block text-muted">{hint}</small></Card.Body></Card></Col>)}</Row>
    </Container>
  );
};
