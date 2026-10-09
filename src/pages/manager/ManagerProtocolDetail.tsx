import React, { useState } from 'react';
import { Row, Col, Modal, Button, Form, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import './manager.css';

// Mock detail
const MOCK_DETAIL = {
  id: 'PD-0011', status: 'READY_TO_APPROVE',
  horse: { id: 1, name: 'Storm', breed: 'Arabian' },
  vet: { id: 3, fullName: 'Lê Thị Hương' },
  case: { id: 'C-0012', diagnosis: 'Sưng gân gấp chân trước trái' },
  createdAt: '2026-10-02T16:48:00',
  stockVerifiedAt: '2026-10-05T09:30:00',
  stockVerifiedBy: 'Trần Văn Kho',
  warehouseNote: 'Đã đủ vật tư sau khi nhập lô hàng SHIP-0023.',
  totalCost: 8400000,
  phases: [
    { phase: 1, name: 'Chống viêm cấp', startDate: '2026-10-08', durationDays: 10, goal: 'Giảm sưng', subtotal: 5000000,
      items: [{ itemId: 'VT-0002', name: 'Thuốc ABC', quantity: 10, unit: 'lọ', unitPrice: 500000, totalPrice: 5000000, currentStock: 30 }] },
    { phase: 2, name: 'Phục hồi gân', startDate: '2026-10-18', durationDays: 14, goal: '', subtotal: 2400000,
      items: [{ itemId: 'VT-0003', name: 'Thuốc XYZ', quantity: 30, unit: 'viên', unitPrice: 80000, totalPrice: 2400000, currentStock: 45 }] },
  ],
};

export const ManagerProtocolDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canApprove = MOCK_DETAIL.status === 'READY_TO_APPROVE';

  const handleApprove = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setShowApprove(false);
    alert('Duyệt phác đồ thành công!');
    navigate('/manager/protocols');
  };

  const handleReject = async () => {
    if (reason.trim().length < 10) { alert('Lý do phải có ít nhất 10 ký tự'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setShowReject(false);
    alert('Từ chối phác đồ thành công!');
    navigate('/manager/protocols');
  };

  return (
    <div className="manager-page">
      <button className="btn btn-sm btn-link p-0 mb-2" onClick={() => navigate(-1)}>← Quay lại</button>

      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Phác đồ {id}</h2>
          <p className="text-muted mb-0">Tạo ngày {new Date(MOCK_DETAIL.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        {canApprove && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger" onClick={() => setShowReject(true)}>Từ chối</button>
            <button className="btn btn-primary" onClick={() => setShowApprove(true)}>Phê duyệt</button>
          </div>
        )}
      </div>

      {!canApprove && (
        <Alert variant="warning">
          ⚠ Phác đồ chưa đủ vật tư (trạng thái <strong>{MOCK_DETAIL.status}</strong>). Không thể duyệt lúc này.
          Vui lòng chờ Quản lý kho xác nhận.
        </Alert>
      )}

      <Row className="g-4">
        <Col md={8}>
          <div className="detail-section">
            <h5>Thông tin chung</h5>
            <div className="detail-row"><span className="label">Ngựa</span><span className="value">{MOCK_DETAIL.horse.name} ({MOCK_DETAIL.horse.breed})</span></div>
            <div className="detail-row"><span className="label">Bác sĩ</span><span className="value">{MOCK_DETAIL.vet.fullName}</span></div>
            <div className="detail-row"><span className="label">Ca khám</span><span className="value">{MOCK_DETAIL.case.id}</span></div>
            <div className="detail-row"><span className="label">Chẩn đoán</span><span className="value">{MOCK_DETAIL.case.diagnosis}</span></div>
          </div>

          {MOCK_DETAIL.phases.map((phase) => (
            <div key={phase.phase} className="detail-section">
              <h5>Giai đoạn {phase.phase}: {phase.name}</h5>
              <div className="detail-row"><span className="label">Bắt đầu</span><span className="value">{phase.startDate}</span></div>
              <div className="detail-row"><span className="label">Thời lượng</span><span className="value">{phase.durationDays} ngày</span></div>
              {phase.goal && <div className="detail-row"><span className="label">Mục tiêu</span><span className="value">{phase.goal}</span></div>}

              <table className="manager-table mt-3">
                <thead>
                  <tr>
                    <th>THUỐC / VẬT TƯ</th>
                    <th>SỐ LƯỢNG</th>
                    <th>ĐƠN GIÁ</th>
                    <th>THÀNH TIỀN</th>
                    <th>TỒN KHO</th>
                  </tr>
                </thead>
                <tbody>
                  {phase.items.map((item: any) => (
                    <tr key={item.itemId}>
                      <td className="fw-semibold">{item.name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{item.unitPrice.toLocaleString('vi-VN')} đ</td>
                      <td className="fw-semibold">{item.totalPrice.toLocaleString('vi-VN')} đ</td>
                      <td><span className="status-badge status-approved">{item.currentStock}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </Col>

        <Col md={4}>
          <div className="detail-section">
            <h5>Xác nhận từ kho</h5>
            <div className="detail-row"><span className="label">Người xác nhận</span><span className="value">{MOCK_DETAIL.stockVerifiedBy}</span></div>
            <div className="detail-row"><span className="label">Thời gian</span><span className="value">{new Date(MOCK_DETAIL.stockVerifiedAt).toLocaleString('vi-VN')}</span></div>
            <div className="mt-3 p-3 bg-light rounded small">
              <strong>Ghi chú:</strong> {MOCK_DETAIL.warehouseNote}
            </div>
          </div>

          <div className="detail-section">
            <h5>Tổng chi phí</h5>
            <div className="text-center py-3">
              <div className="fs-3 fw-bold" style={{ color: 'var(--primary)' }}>
                {MOCK_DETAIL.totalCost.toLocaleString('vi-VN')} đ
              </div>
              <small className="text-muted">Bao gồm {MOCK_DETAIL.phases.length} giai đoạn</small>
            </div>
          </div>
        </Col>
      </Row>

      {/* Approve Modal */}
      <Modal show={showApprove} onHide={() => setShowApprove(false)} centered>
        <Modal.Header closeButton><Modal.Title>Phê duyệt phác đồ {id}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="small">Khi phê duyệt, hệ thống sẽ tự động trừ tồn kho và gửi thông báo đến BS và Quản lý kho.</Alert>
          <Form.Group>
            <Form.Label className="small fw-bold">Ghi chú (không bắt buộc)</Form.Label>
            <Form.Control as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprove(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleApprove} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showReject} onHide={() => setShowReject(false)} centered>
        <Modal.Header closeButton><Modal.Title>Từ chối phác đồ {id}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="small fw-bold">Lý do từ chối *</Form.Label>
            <Form.Control as="textarea" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Chi phí vượt ngân sách tháng..." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReject(false)}>Hủy</Button>
          <Button variant="danger" onClick={handleReject} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
