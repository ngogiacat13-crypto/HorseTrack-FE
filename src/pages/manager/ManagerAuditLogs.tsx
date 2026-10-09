import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { managerApi } from '../../api/managerApi';
import './manager.css';

export const ManagerAuditLogs: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerApi.getAuditLogs().then((res) => { setData(res); setLoading(false); });
  }, []);

  if (loading || !data) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div className="manager-page">
      <h2 className="fw-bold mb-1">Nhật ký hệ thống</h2>
      <p className="text-muted mb-4">Mọi thao tác quan trọng đều được ghi log (BR_10)</p>

      <div className="section-card">
        <table className="manager-table">
          <thead>
            <tr>
              <th>LOG ID</th>
              <th>NGƯỜI DÙNG</th>
              <th>VAI TRÒ</th>
              <th>HÀNH ĐỘNG</th>
              <th>ĐỐI TƯỢNG</th>
              <th>IP</th>
              <th>THỜI GIAN</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((log: any) => (
              <tr key={log.logId}>
                <td className="fw-semibold">{log.logId}</td>
                <td>{log.userName}</td>
                <td><span className="badge bg-secondary">{log.userRole}</span></td>
                <td><code>{log.action}</code></td>
                <td className="small">{log.entity} #{log.entityId}</td>
                <td className="small text-muted">{log.ipAddress}</td>
                <td className="small">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
