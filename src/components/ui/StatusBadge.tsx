import React from 'react';
import { Badge } from 'react-bootstrap';

interface Props {
  status: string;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Healthy': return { bg: '#D8F3DC', color: '#2B9348', label: 'Khỏe mạnh' };
      case 'UnderObservation': return { bg: '#FDEBD0', color: '#E67E22', label: 'Theo dõi' };
      case 'Injured': return { bg: '#FADBD8', color: '#E63946', label: 'Chấn thương' };
      case 'Quarantined': return { bg: '#E8DAEF', color: '#7B2CBF', label: 'Cách ly' };
      case 'Overdue': return { bg: '#FADBD8', color: '#E63946', label: 'Quá hạn' };
      case 'Pending': return { bg: '#D6E4FF', color: '#5B7FFF', label: 'Chờ xử lý' };
      case 'Paid': return { bg: '#D5F5E3', color: '#27AE60', label: 'Đã thanh toán' };
      default: return { bg: '#E2E3E5', color: '#383D41', label: status };
    }
  };

  const style = getBadgeStyle();

  return (
    <Badge style={{ backgroundColor: style.bg, color: style.color, fontWeight: 500, padding: '6px 10px' }}>
      ● {style.label}
    </Badge>
  );
};
