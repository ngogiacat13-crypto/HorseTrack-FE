import React from 'react';
import type { Registration } from '../../../api/managerApi';
import { Icon } from '../../../components/ui/Icon';
import { Badge, Panel } from '../../../components/ui/Ht';

type Check = Registration['checklist'][number];

export const ChecklistPanel: React.FC<{ checks: Check[]; locked: boolean; onSet: (key: string, ok: boolean) => void }> = ({ checks, locked, onSet }) => {
  const passed = checks.filter((c) => c.passed).length;
  const allPassed = passed === checks.length;
  return (
    <Panel title="Checklist xét duyệt"
      sub={<span id="approve-why">{allPassed ? 'Tất cả mục đã đạt — có thể phê duyệt.' : `Chỉ phê duyệt khi cả ${checks.length} mục đều đạt. Còn ${checks.length - passed} mục chưa đạt.`}</span>}
      right={<Badge tone={allPassed ? 'success' : 'warning'} plain>{passed}/{checks.length} đạt</Badge>}>
      <div className="ht-panel__body">
        <ul className="ht-checks">
          {checks.map((c) => (
            <li key={c.key} className="ht-checkrow" data-state={c.passed ? 'pass' : 'fail'}>
              <span className="ht-checkrow__icon"><Icon name={c.passed ? 'check' : 'x'} /></span>
              <div><b>{c.label}</b><small>{c.detail}</small></div>
              <div className="ht-seg" role="group" aria-label={c.label}>
                <button type="button" aria-pressed={c.passed} disabled={locked} onClick={() => onSet(c.key, true)}>Đạt</button>
                <button type="button" aria-pressed={!c.passed} disabled={locked} onClick={() => onSet(c.key, false)}>Không đạt</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
};
