import React, { useEffect, useState } from 'react';
import { Row, Col, Spinner, Modal, Button, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { managerApi, RegistrationDetail } from '../../api/managerApi';
import './manager.css';

export const ManagerRegistrationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<RegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) managerApi.getRegistrationDetail(id).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  const handleApprove = async () => {
    setSubmitting(true);
    await managerApi.approveRegistration(id!, { note });
    setSubmitting(false);
    setShowApprove(false);
    alert('Duyệt thành công!');
    navigate('/manager/registrations');
  };

  const handleReject = async () => {
    if (reason.trim().length < 10) {
      alert('Lý do từ chối phải có ít nhất 10 ký tự.');
      return;
    }
    setSubmitting(true);
    await managerApi.rejectRegistration(id!, { reason });
    setSubmitting(false);
    setShowReject(false);
    alert('Từ chối thành công!');
    navigate('/manager/registrations');
  };

  if (loading || !data) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div className="manager-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button className="btn btn-sm btn-link p-0 mb-2" onClick={() => navigate(-1)}>← Quay lại</button>
          <h2 className="fw-bold mb-1">Chi tiết hồ sơ {data.id}</h2>
          <p className="text-muted mb-0">Ngày gửi: {new Date(data.submittedAt).toLocaleString('vi-VN')}</p>
        </div>
        {data.status === 'Pending' && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger" onClick={() => setShowReject(true)}>Từ chối</button>
            <button className="btn btn-primary" onClick={() => setShowApprove(true)}>Phê duyệt</button>
          </div>
        )}
      </div>

      <Row className="g-4">
        {/* Cột trái */}
        <Col md={8}>
          {/* Thông tin chủ ngựa */}
          <div className="detail-section">
            <h5>Thông tin Chủ ngựa</h5>
            <div className="detail-row"><span className="label">Họ và tên</span><span className="value">{data.submittedBy.fullName}</span></div>
            <div className="detail-row"><span className="label">Email</span><span className="value">{data.submittedBy.email}</span></div>
            <div className="detail-row"><span className="label">Số điện thoại</span><span className="value">{data.submittedBy.phone}</span></div>
            <div className="detail-row"><span className="label">Mã số thuế</span><span className="value">{data.submittedBy.taxCode || 'Không có'}</span></div>
            <div className="detail-row"><span className="label">Địa chỉ thanh toán</span><span className="value">{data.submittedBy.billingAddress}</span></div>
          </div>

          {/* Thông tin ngựa */}
          <div className="detail-section">
            <h5>Thông tin Ngựa</h5>
            <Row>
              <Col md={6}>
                <div className="detail-row"><span className="label">Tên ngựa</span><span className="value">{data.horse.name}</span></div>
                <div className="detail-row"><span className="label">Mã ngựa</span><span className="value">{data.horse.code}</span></div>
                <div className="detail-row"><span className="label">Giống</span><span className="value">{data.horse.breed}</span></div>
                <div className="detail-row"><span className="label">Tuổi</span><span className="value">{data.horse.age}</span></div>
                <div className="detail-row"><span className="label">Giới tính</span><span className="value">{data.horse.gender}</span></div>
              </Col>
              <Col md={6}>
                <div className="detail-row"><span className="label">Màu lông</span><span className="value">{data.horse.color}</span></div>
                <div className="detail-row"><span className="label">Chiều cao</span><span className="value">{data.horse.height}</span></div>
                <div className="detail-row"><span className="label">Cân nặng</span><span className="value">{data.horse.weight} kg</span></div>
                <div className="detail-row"><span className="label">Microchip</span><span className="value">{data.horse.microchipId}</span></div>
                <div className="detail-row"><span className="label">Hộ chiếu</span><span className="value">{data.horse.passportNumber}</span></div>
              </Col>
            </Row>
          </div>

          {/* Checklist */}
          <div className="detail-section">
            <h5>Kiểm tra điều kiện</h5>
            {data.validationChecklist.map((c) => (
              <div key={c.key} className={`checklist-item ${c.passed ? 'passed' : 'failed'}`}>
                <div className={`checklist-icon ${c.passed ? 'passed' : 'failed'}`}>{c.passed ? '✓' : '✕'}</div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">{c.label}</div>
                  {c.reason && <div className="checklist-reason">⚠ {c.reason}</div>}
                </div>
              </div>
            ))}
          </div>
        </Col>

        {/* Cột phải */}
        <Col md={4}>
          <div className="detail-section">
            <h5>Tài liệu đính kèm</h5>
            {data.attachments.map((a, i) => (
              <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                  <div className="fw-semibold small">{a.name}</div>
                  <div className="text-muted small">{a.uploadedAt}</div>
                </div>
                <a href={a.url} className="btn btn-sm btn-outline-primary">Xem</a>
              </div>
            ))}
          </div>

          <div className="detail-section">
            <h5>Lịch sử thao tác</h5>
            {data.auditTrail.map((a, i) => (
              <div key={i} className="log-item" style={{ padding: '8px 0' }}>
                <div className="log-dot success" />
                <div>
                  <div className="fw-semibold small">{a.action}</div>
                  <div className="log-time">{a.by} — {new Date(a.at).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>

      {/* Modal Approve */}
      <Modal show={showApprove} onHide={() => setShowApprove(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Phê duyệt hồ sơ {data.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="small fw-bold">Ghi chú phê duyệt (không bắt buộc)</Form.Label>
            <Form.Control as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Hồ sơ hợp lệ, đã xác minh đầy đủ giấy tờ." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprove(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleApprove} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Reject */}
      <Modal show={showReject} onHide={() => setShowReject(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Từ chối hồ sơ {data.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="small fw-bold">Lý do từ chối * (tối thiểu 10 ký tự)</Form.Label>
            <Form.Control as="textarea" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Giấy tờ sở hữu ngựa không hợp lệ, thiếu chữ ký của cơ quan có thẩm quyền." />
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
