import React, { useState } from 'react';
import { FeedRequest, VetHorse } from '../../../api/vetApi';
import { Icon } from '../../../components/ui/Icon';
import { Panel } from '../../../components/ui/Ht';
import { USE_BACKEND } from '../../../api/beClient';
import { NutritionPlanPanel } from '../../../features/nutrition-plan';
import { DietDialog } from './DietDialog';
import { FeedRequestList } from './FeedRequestList';

export const DietPanel: React.FC<{ horse: VetHorse; pendingFeeds: FeedRequest[]; onChanged: () => void }> = ({ horse, pendingFeeds, onChanged }) => {
  const [dietOpen, setDietOpen] = useState(false);
  const diet = horse.medicalDiet;
  const feedList = <FeedRequestList requests={pendingFeeds} onChanged={onChanged} />;

  if (USE_BACKEND) {
    return (
      <>
        <NutritionPlanPanel key={`np-${pendingFeeds.length}`} horseId={horse.id} horseName={horse.name} locked={horse.trainingLocked} role="Veterinarian" title="Khẩu phần / thực đơn" onChanged={onChanged}>{feedList}</NutritionPlanPanel>
      </>
    );
  }

  return (
    <Panel as="h3" title="Khẩu phần y tế" right={<button type="button" className="ht-more" onClick={() => setDietOpen(true)}>{diet ? 'Sửa' : 'Chỉ định'} <Icon name="arrow" /></button>}>
      <div className="ht-panel__body" style={{ display: 'grid', gap: 10 }}>
        {diet ? (
          <>
            <div className="ht-meals">
              <div><span className="ht-overline">Sáng</span>{diet.morning || '—'}</div>
              <div><span className="ht-overline">Trưa</span>{diet.noon || '—'}</div>
              <div><span className="ht-overline">Chiều</span>{diet.evening || '—'}</div>
            </div>
            {diet.special && <div style={{ fontSize: 13 }}><b>Đặc biệt:</b> {diet.special}</div>}
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{diet.note} · BS {diet.by} · {diet.at}</div>
          </>
        ) : <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Khẩu phần thường. Chỉ định khẩu phần y tế khi ngựa bị khóa hoặc đang điều trị (BR_03).</p>}
        {feedList}
      </div>
      {dietOpen && <DietDialog horse={horse} onClose={() => setDietOpen(false)} onDone={() => { setDietOpen(false); onChanged(); }} />}
    </Panel>
  );
};
