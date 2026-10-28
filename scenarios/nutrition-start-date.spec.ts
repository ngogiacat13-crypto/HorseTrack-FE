import { expect, test } from '@playwright/test';
import { newLine, plusDaysIso, startMin, todayIso, validateDraft, type PlanDraft } from '../src/features/nutrition-plan/logic';

const draft = (startDate: string): PlanDraft => ({ startDate, endDate: plusDaysIso(30), notes: '', lines: [{ ...newLine('MORNING'), itemId: '1', quantity: '2' }] });

test('a new nutrition plan cannot start in the past', () => {
  expect(() => validateDraft(draft(plusDaysIso(-1)))).toThrow(/quá khứ/);
  expect(() => validateDraft(draft(todayIso()))).not.toThrow();
  expect(startMin()).toBe(todayIso());
});

test('editing a running plan keeps its old start date but cannot move it into the past', () => {
  const kept = plusDaysIso(-5);
  expect(() => validateDraft(draft(kept), kept)).not.toThrow();
  expect(() => validateDraft(draft(plusDaysIso(-3)), kept)).toThrow(/quá khứ/);
  expect(startMin(kept)).toBe(kept);
});
