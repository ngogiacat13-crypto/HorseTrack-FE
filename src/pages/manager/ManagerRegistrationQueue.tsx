import React, { useEffect, useState } from 'react';
import { Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { managerApi, Registration } from '../../api/managerApi';
import './manager.css';

export const ManagerRegistrationQueue: React.FC = () => {
  const [items, setItems] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');

  useEffect(() => {
    setLoading(true);
    managerApi.getRegistrations().then((res) => {
      setItems(res);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'All' ? items : items.filter((i) => i.status === filter);

  return (
    <div className="manager-page">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Hàng đợi đăng ký</h2>
        <p className="text-muted mb-0">Duyệt hồ sơ Chủ ngựa & Ngựa đua mới</p>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'Pending' ? 'Chờ duyệt' : s === 'Approved' ? 'Đã duyệt' : s === 'Rejected' ? 'Đã từ chối' : 'Tất cả'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <div className="section-card">
          <table className="manager-table">
            <thead>
              <tr>
                <th>MÃ HỒ SƠ</th>
                <th>NGỰA</th>
                <th>CHỦ NGỰA</th>
                <th>LIÊN HỆ</th>
                <th>NGÀY GỬI</th>
                <th>ƯU TIÊN</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="fw-semibold">{r.id}</td>
                  <td>
                    <div className="fw-semibold">{r.horse.name}</div>
                    <div className="text-muted small">{r.horse.code}</div>
                  </td>
                  <td>{r.owner.fullName}</td>
                  <td>
                    <div className="small">{r.owner.email}</div>
                    <div className="text-muted small">{r.owner.phone}</div>
                  </td>
                  <td>{new Date(r.submittedAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <Badge bg={r.priority === 'High' ? 'danger' : 'secondary'}>
                      {r.priority === 'High' ? 'Cao' : 'Bình thường'}
                    </Badge>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        r.status === 'Approved' ? 'status-approved' :
                        r.status === 'Rejected' ? 'status-rejected' : 'status-pending'
                      }`}
                    >
                      {r.status === 'Approved' ? 'Đã duyệt' : r.status === 'Rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/manager/registrations/${r.id}`} className="btn btn-sm btn-outline-primary">
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
