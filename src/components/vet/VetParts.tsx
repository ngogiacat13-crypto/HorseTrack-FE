import React from 'react';
import type { ProtocolState } from '../../api/managerApi';
import { CaseSource, Protocol, PROTOCOL_FLOW, PROTOCOL_LABEL, Severity, SEVERITY_LABEL, SOURCE_LABEL } from '../../api/vetApi';
import { Badge } from '../ui/Ht';
import { Icon, IconName } from '../ui/Icon';

/* Small building blocks shared by the Veterinarian pages. */

const SOURCE_ICON: Record<CaseSource, IconName> = { SESSION_STOP: 'pulse', GROOM_REPORT: 'warn', TRAINER_REQUEST: 'send' };

export const CaseSourceTag: React.FC<{ source: CaseSource }> = ({ source }) => (
  <span className="ht-source" data-src={source}><Icon name={SOURCE_ICON[source]} />{SOURCE_LABEL[source]}</span>
);

export const SeverityTag: React.FC<{ severity: Severity }> = ({ severity }) => (
  <span className="ht-sev" data-sev={severity}>{SEVERITY_LABEL[severity][0]}</span>
);

export const ProtocolBadge: React.FC<{ state: ProtocolState; delayed?: boolean }> = ({ state, delayed }) => {
  const [label, tone] = PROTOCOL_LABEL[state];
  return <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}><Badge tone={tone}>{label}</Badge>{delayed && state !== 'COMPLETED' && <Badge tone="danger" plain>Hàng trễ mốc</Badge>}</span>;
};

/** The protocol's real path; main-flow steps not reached yet are shown faded. */
export const ProtocolPath: React.FC<{ protocol: Pick<Protocol, 'path' | 'state'> }> = ({ protocol }) => {
  const seen = protocol.path;
  const rest = PROTOCOL_FLOW.filter((s) => !seen.includes(s) && PROTOCOL_FLOW.indexOf(s) > Math.max(...seen.map((x) => PROTOCOL_FLOW.indexOf(x))));
  const closed = ['COMPLETED', 'SUPERSEDED', 'CANCELLED'].includes(protocol.state);
  const alt: ProtocolState[] = ['STOCK_SHORTAGE', 'REQUIRES_VET_REVIEW', 'SUPERSEDED', 'CANCELLED'];
  return (
    <div className="ht-path" aria-label="Trạng thái phác đồ">
      {seen.map((s, i) => (
        <React.Fragment key={`${s}-${i}`}>
          {i > 0 && <Icon name="chev" />}
          <span data-state={i === seen.length - 1 ? (alt.includes(s) ? 'alt' : 'current') : 'done'}>{s}</span>
        </React.Fragment>
      ))}
      {!closed && rest.map((s) => <React.Fragment key={s}><Icon name="chev" /><span>{s}</span></React.Fragment>)}
    </div>
  );
};
