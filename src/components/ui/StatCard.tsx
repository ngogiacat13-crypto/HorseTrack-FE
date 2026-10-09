import React from 'react';
import { Card } from 'react-bootstrap';

interface Props {
  icon: string;
  value: string | number;
  label: string;
  trend?: string;
  trendColor?: string;
}

export const StatCard: React.FC<Props> = ({ icon, value, label, trend, trendColor }) => {
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          {trend && <span style={{ color: trendColor || '#2B9348', fontSize: '0.85rem', fontWeight: 600 }}>{trend}</span>}
        </div>
        <h3 className="fw-bold mb-1">{value}</h3>
        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{label}</p>
      </Card.Body>
    </Card>
  );
};
