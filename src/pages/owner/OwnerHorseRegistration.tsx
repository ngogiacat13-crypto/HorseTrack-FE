import React, { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { HorseRegistrationRecord } from '../../api/mockData';
import { saveHorseRegistration } from '../../api/registrationStore';
import { useAuth } from '../../auth/AuthContext';

type HorseGender = HorseRegistrationRecord['gender'];
type HorseHealthStatus = HorseRegistrationRecord['healthStatus'];

const genderLabels: Record<HorseGender, string> = {
  Colt: 'Ngựa đực non (Colt)',
  Filly: 'Ngựa cái non (Filly)',
  Stallion: 'Ngựa đực (Stallion)',
  Mare: 'Ngựa cái (Mare)',
  Gelding: 'Ngựa đực thiến (Gelding)',
};

const healthLabels: Record<HorseHealthStatus, string> = {
  Healthy: 'Khỏe mạnh',
  Need_Check: 'Cần kiểm tra',
  Injured: 'Bị chấn thương',
  Isolated: 'Cách ly',
};

export const OwnerHorseRegistration: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    horseName: '',
    dob: '',
    gender: 'Colt' as HorseGender,
    breed: 'Thoroughbred',
    pedigree: '',
    weightKg: '',
    healthStatus: 'Healthy' as HorseHealthStatus,
    prizeSharePct: '0',
    stallId: '',
  });
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');

  const update = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!form.horseName.trim() || !form.dob || !form.breed.trim() || Number(form.weightKg) <= 0) {
      setError('Vui lòng nhập tên, ngày sinh, giống và cân nặng lớn hơn 0 kg.');
      return;
    }
    if (Number(form.prizeSharePct) < 0 || Number(form.prizeSharePct) > 100) {
      setError('Tỷ lệ chia giải phải nằm trong khoảng 0–100%.');
      return;
    }

    const horseId = `h-${Date.now()}`;
    saveHorseRegistration({
      horseId,
      horseName: form.horseName.trim(),
      dob: form.dob,
      gender: form.gender,
      breed: form.breed.trim(),
      pedigree: form.pedigree.trim(),
      weightKg: Number(form.weightKg),
      healthStatus: form.healthStatus,
      isLocked: false,
      prizeSharePct: Number(form.prizeSharePct || 0),
      ownerId: user.id,
      stallId: form.stallId ? Number(form.stallId) : null,
      createdAt: new Date().toISOString(),
      registrationStatus: 'Registered',
    });
    setSuccessId(horseId);
  };

  return (
    <Container fluid>
      <div className="mb-4">
        <div className="text-uppercase small text-primary fw-semibold">Hồ sơ Horses</div>
        <h2 className="fw-bold mb-1" style={{ color: '#1B4332' }}>Đăng ký ngựa đua mới</h2>
        <p className="text-muted mb-0">Biểu mẫu này sử dụng đúng các trường của bảng Horses trong Data4.txt.</p>
      </div>

      {successId ? (
        <Alert variant="success" className="shadow-sm border-0">
          <Alert.Heading>Đã gửi hồ sơ ngựa</Alert.Heading>
          <p className="mb-3">Mã hồ sơ <strong>{successId}</strong> đang ở trạng thái <strong>Registered</strong> và chờ CLB phê duyệt.</p>
          <Button as={Link as any} to="/owner" variant="success">Về trang ngựa của tôi</Button>
        </Alert>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-4">
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            <Form onSubmit={submit} noValidate>
              <Row className="g-3">
                <Col md={8}>
                  <Form.Group controlId="ownerHorseName">
                    <Form.Label>Tên ngựa <span className="text-danger">*</span></Form.Label>
                    <Form.Control name="horseName" value={form.horseName} onChange={update} placeholder="Galaxy Star" required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="ownerHorseDob">
                    <Form.Label>Ngày sinh <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="date" name="dob" value={form.dob} onChange={update} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="ownerHorseBreed">
                    <Form.Label>Giống ngựa <span className="text-danger">*</span></Form.Label>
                    <Form.Control name="breed" value={form.breed} onChange={update} placeholder="Thoroughbred" required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="ownerHorseGender">
                    <Form.Label>Giới tính <span className="text-danger">*</span></Form.Label>
                    <Form.Select name="gender" value={form.gender} onChange={update}>{Object.entries(genderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="ownerHorseWeight">
                    <Form.Label>Cân nặng (kg) <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="number" min="0.01" step="0.01" name="weightKg" value={form.weightKg} onChange={update} required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="ownerHorseHealth">
                    <Form.Label>Tình trạng sức khỏe</Form.Label>
                    <Form.Select name="healthStatus" value={form.healthStatus} onChange={update}>{Object.entries(healthLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="ownerHorsePrize">
                    <Form.Label>Tỷ lệ chia giải (%)</Form.Label>
                    <Form.Control type="number" min="0" max="100" step="0.01" name="prizeSharePct" value={form.prizeSharePct} onChange={update} />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group controlId="ownerHorsePedigree">
                    <Form.Label>Phả hệ</Form.Label>
                    <Form.Control as="textarea" rows={4} name="pedigree" value={form.pedigree} onChange={update} placeholder="Bố, mẹ hoặc thông tin phả hệ" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="ownerHorseStall">
                    <Form.Label>Mã chuồng (stall_id)</Form.Label>
                    <Form.Control type="number" min="1" step="1" name="stallId" value={form.stallId} onChange={update} placeholder="Không bắt buộc" />
                    <Form.Text>Để trống nếu chưa được xếp chuồng.</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <Button type="submit" variant="primary" className="px-4">Gửi hồ sơ đăng ký</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};
