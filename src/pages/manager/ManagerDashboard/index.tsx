import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { managerApi } from '../../../api/managerApi';
import { useActor } from '../../../auth/AuthContext';
import { Icon } from '../../../components/ui/Icon';
import { Loading, PageHeader, StatCard, useToast } from '../../../components/ui/Ht';
import { USE_BACKEND } from '../../../api/beClient';
import { DEMO_NOW } from '../../../api/http';
import type { Dash } from './types';
import { RecentRegistrations, TodaySessions, VetCostChart } from './MainPanels';
import { LateTasks, MedicalWatch, OverdueInvoices, SystemLog } from './SidePanels';

const greetingOf = (time: string) => {
  const hour = Number(time.slice(0, 2));
  return hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
};

export const ManagerDashboard: React.FC = () => {
  const [d, setD] = useState<Dash | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const actor = useActor();

  useEffect(() => { managerApi.getDashboard().then(setD); }, []);
  if (!d) return <div className="ht ht-page"><Loading /></div>;

  return (
    <div className="ht ht-page">
      <PageHeader
        title="Bảng điều khiển"
        sub={<>{greetingOf(DEMO_NOW.time)}, {actor.name} · {d.greeting.weekday}, <span className="ht-mono">{d.greeting.date}</span></>}
        actions={USE_BACKEND ? undefined : <>
          <select className="ht-select" aria-label="Khoảng thời gian"><option>Hôm nay</option><option>7 ngày</option><option>Tháng này</option></select>
          <button className="ht-btn ht-btn--secondary" onClick={() => toast('Đang xuất báo cáo tổng quan (PDF)…')}><Icon name="download" />Xuất báo cáo</button>
        </>}
      />

      {d.stoppedToday?.map((s) => (
        <div key={s.session} className="ht-banner" role="alert" data-testid="dashboard-stopped-session">
          <Icon name="alarm" />
          <div>
            <b>Phiên tập <span className="ht-mono">{s.session}</span> ({s.horse}) lúc <span className="ht-mono">{s.at}</span> đã bị dừng — chờ Bác sĩ thú y quyết định.</b>
            {s.note && <p>{s.note}</p>}
          </div>
          <Link className="ht-more" to="/manager/audit-logs">Xem nhật ký <Icon name="arrow" /></Link>
        </div>
      ))}

      {d.autoStop && <div className="ht-banner" role="alert">
        <Icon name="alarm" />
        <div>
          <b>Phiên tập <span className="ht-mono">{d.autoStop.session}</span> ({d.autoStop.horse}) đã tự dừng lúc <span className="ht-mono">{d.autoStop.at}</span> — nhịp tim {d.autoStop.hr} bpm, ngưỡng {d.autoStop.limit} (BR_02).</b>
          <p>HLV trưởng {d.autoStop.decidedBy} đã dừng phiên và gửi ca khám <span className="ht-mono">{d.autoStop.caseId}</span> cho Bác sĩ lúc <span className="ht-mono">{d.autoStop.decidedAt}</span>. Bạn chỉ theo dõi.</p>
        </div>
        <Link className="ht-more" to="/manager/audit-logs">Xem nhật ký <Icon name="arrow" /></Link>
      </div>}

      <div className="ht-stats">
        <StatCard icon="pulse" tone="brand" value={d.kpi.horses} label="Ngựa đang quản lý" meta={d.kpi.horsesTrend} metaTone="up" />
        <StatCard icon="clip" tone="info" value={d.kpi.pendingRegs} label="Hồ sơ ngựa chờ duyệt" meta={`cũ nhất ${d.kpi.oldestPendingDays} ngày`} onClick={() => navigate('/manager/registrations')} />
        <StatCard icon="heart" tone="gold" value={d.kpi.medicalWatch} label="Ca y tế cần theo dõi" meta={d.kpi.shortage ? `${d.kpi.shortage} thiếu thuốc` : "không thiếu thuốc"} onClick={() => navigate('/manager/medical-monitoring')} />
        <StatCard icon="alarm" tone="danger" value={d.kpi.lateTasks} label="Việc trễ SLA > 45 phút" meta={`+${d.kpi.lateTasksToday} hôm nay`} metaTone="danger" alert />
        <StatCard icon="truck" tone="warning" value={d.kpi.delayedShipments} label="Lô hàng kho bị trễ" meta={d.kpi.delayedShipments ? `ETA ${d.kpi.delayedEta}` : "đúng hẹn"} onClick={() => navigate('/manager/medical-monitoring')} />
      </div>

      <div className="ht-cols">
        <div>
          <RecentRegistrations d={d} />
          <TodaySessions d={d} />
          {d.vetCost?.some((c: { value: number }) => c.value > 0) && <VetCostChart d={d} />}
        </div>
        <div>
          <MedicalWatch d={d} />
          <OverdueInvoices d={d} />
          <LateTasks d={d} />
          <SystemLog d={d} />
        </div>
      </div>
    </div>
  );
};
