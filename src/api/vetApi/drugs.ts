import type { InventoryItem, Protocol } from './types';
import { dateKey, addDays } from './dates';

export interface DrugWindow { protocolId: string; drug: string; lastDose: string; clearFrom: string; hours: number }
export const drugWindows = (protocols: Protocol[], inventory: InventoryItem[], horseId: string): DrugWindow[] => {
  const det = new Map(inventory.filter((i) => i.detectionHours).map((i) => [i.id, i.detectionHours as number]));
  return protocols
    .filter((p) => p.horseId === horseId && !['SUPERSEDED', 'CANCELLED', 'DRAFT'].includes(p.state))
    .flatMap((p) => p.phases.flatMap((ph) => ph.items.filter((it) => det.has(it.itemId)).map((it) => {
      const hours = det.get(it.itemId) as number;
      const lastDose = addDays(ph.startDate, Math.max(0, ph.days - 1));
      return { protocolId: p.id, drug: it.name, lastDose, clearFrom: addDays(lastDose, Math.ceil(hours / 24)), hours };
    })));
};
export const blockingWindows = (windows: DrugWindow[], raceDate: string) => windows.filter((w) => dateKey(w.clearFrom) > dateKey(raceDate));
