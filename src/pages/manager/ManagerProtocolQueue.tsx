import React, { useEffect, useState } from 'react';
import { Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { managerApi, Protocol } from '../../api/managerApi';
import './manager.css';

export const ManagerProtocolQueue: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerApi.getProtocols().then((res) => { setItems(res); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  const getStatusBadge = (s: Protocol['status']) => {
    switch (s) {
      case 'READY_TO_APPROVE': return <span className="status-badge status-ready">Sẵn sàng duyệt</span>;
      case 'PENDING_STOCK': return <span className="status-badge status-pending-stock">Chờ kho xác nhận</span>;
      case 'APPROVED': return <span className="status-badge status-approved">Đã duyệt</span>;
      case 'REJECTED': return <span className="status-badge status-rejected">Đã từ chối</span>;
      default: return <span className="status-badge status-pending">{s}</span>;
    }
  };

  return (
    <div className="manager-page">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Phác đồ điều trị</h2>
        <p className="text-muted mb-0">Chỉ duyệt phác đồ đã được kho xác nhận đủ vật tư (BR_07)</p>
      </div>

      <div className="alert alert-info small">
        💡 <strong>Lưu ý:</strong> Phác đồ trạng thái <strong>"Chờ kho xác nhận"</strong> chưa thể duyệt.
        Vui lòng chờ Quản lý kho xử lý xong.
      </div>

      <div className="section-card">
        <table className="manager-table">
          <thead>
            <tr>
              <th>MÃ PHÁC ĐỒ</th>
              <th>NGỰA</th>
              <th>BÁC SĨ</th>
              <th>CHẨN ĐOÁN</th>
              <th>CHI PHÍ</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td className="fw-semibold">{p.id}</td>
                <td>{p.horse.name}</td>
                <td>{p.vet.fullName}</td>
                <td className="small">{p.case.diagnosis}</td>
                <td className="fw-semibold">{p.totalCost.toLocaleString('vi-VN')} đ</td>
                <td>{getStatusBadge(p.status)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate(`/manager/protocols/${p.id}`)}
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
