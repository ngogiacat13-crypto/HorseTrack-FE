import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { vetApi } from '../../../api/vetApi';
import { useFetch } from '../../../hooks/useFetch';
import { Icon } from '../../../components/ui/Icon';
import { BackButton, PageHeader } from '../../../components/ui/Ht';
import { LoadState } from '../../../components/trainer/TrainerParts';
import { ProtocolBadge, ProtocolPath } from '../../../components/vet/VetParts';
import { ActionDialog, ProtocolAction } from './ActionDialog';
import { DecisionPanel } from './DecisionPanel';
import { AddItemsDialog } from './AddItemsDialog';
import { DispensingHistory } from '../../../features/dispensing-history';
import { LogPanel, PhaseList, ProgressPanel, ProtocolBanners, StockPanel, VersionsPanel } from './ProtocolSections';

export const VetProtocolDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => vetApi.getProtocol(id), [id]);
  const [action, setAction] = useState<ProtocolAction | null>(null);
  const [adding, setAdding] = useState(false);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const { protocol: p, horse, vetCase, versions, shipments } = data;
  const newVersion = () => navigate(`/vet/protocols/new?replace=${p.id}`);

  return (
    <div className="ht ht-page">
      <PageHeader
        crumbs={<BackButton fallback="/vet/protocols" />}
        title={<>Phác đồ <span className="ht-mono">{p.id}</span> <span style={{ color: 'var(--muted)', fontWeight: 500 }}>/ {horse.name}</span></>}
        badge={<ProtocolBadge state={p.state} delayed={p.delayed} />}
        sub={<>{p.diagnosis} · ca <Link to={`/vet/cases?case=${p.caseId}`} className="ht-mono">#{p.caseId}</Link> · phiên bản {p.version}{p.replaces && <> (thay <Link to={`/vet/protocols/${p.replaces}`} className="ht-mono">{p.replaces}</Link>)</>} · BS {p.vet} · lập {p.createdAt}</>}
        actions={<Link className="ht-btn ht-btn--secondary" to={`/vet/horses/${horse.id}`}><Icon name="heart" />Hồ sơ sức khỏe</Link>}
      />

      <div style={{ marginBottom: 20 }}><ProtocolPath protocol={p} /></div>
      <ProtocolBanners protocol={p} />

      <div className="ht-cols">
        <div>
          <PhaseList protocol={p} />
          <StockPanel protocol={p} shipments={shipments} />
          <DispensingHistory protocolBeId={(p as { beId?: number }).beId} />
          <ProgressPanel protocol={p} onAdd={() => setAction('progress')} />
        </div>
        <div>
          <DecisionPanel protocol={p} horse={horse} vetCase={vetCase} onAction={setAction} onNewVersion={newVersion} onAddItems={() => setAdding(true)} />
          <VersionsPanel current={p.id} versions={versions} />
          <LogPanel protocol={p} />
        </div>
      </div>

      {adding && <AddItemsDialog protocol={p} onClose={() => setAdding(false)} onDone={(newId) => { setAdding(false); if (newId === p.id) reload(); else navigate(`/vet/protocols/${newId}`); }} />}
      {action && <ActionDialog protocol={p} action={action} onClose={() => setAction(null)} onDone={() => { setAction(null); reload(); }} />}
    </div>
  );
};
