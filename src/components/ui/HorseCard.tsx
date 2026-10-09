import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Horse } from '../../api/mockData';
import { StatusBadge } from './StatusBadge';

interface Props {
  horse: Horse;
}

export const HorseCard: React.FC<Props> = ({ horse }) => {
  return (
    <Card className="h-100 shadow-sm border-0" style={{ borderLeft: horse.isLocked ? '4px solid #E63946' : '4px solid #2B9348' }}>
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
               style={{ width: '48px', height: '48px', backgroundColor: '#E9ECEF', color: '#1B4332', fontWeight: 'bold', fontSize: '1.2rem' }}>
            {horse.name.charAt(0)}
          </div>
          <div>
            <h5 className="mb-0 fw-bold">{horse.name}</h5>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{horse.breed}</span>
          </div>
        </div>

        <div className="mb-3 d-flex gap-2 flex-wrap">
          <StatusBadge status={horse.healthStatus} />
          {horse.isLocked && <span className="badge" style={{ backgroundColor: '#F5B7B1', color: '#C0392B', padding: '6px 10px' }}>🔒 KHÓA TẬP</span>}
        </div>

        <div className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
          <div>Chủ: {horse.ownerName}</div>
          <div>KH: {horse.trainerPlan || '—'}</div>
        </div>

        <Button as={Link as any} to={`/horses/${horse.id}`} variant="outline-primary" size="sm" className="w-100" style={{ color: '#1B4332', borderColor: '#1B4332' }}>
          Xem chi tiết →
        </Button>
      </Card.Body>
    </Card>
  );
};
