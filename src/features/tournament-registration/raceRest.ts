import { useEffect, useState } from 'react';
import { addDays, fmtDate, isHighIntensity, parseIso, restWindowConflict, toIsoDay, PRE_RACE_REST_DAYS } from './logic';
import { RACE_FLOW_V2, tournamentApi } from './tournamentApi';
import type { RaceTournament } from './types';

export const useHorseRaces = (horseId: string) => {
  const [loaded, setLoaded] = useState<{ horseId: string; races: RaceTournament[] }>({ horseId: '', races: [] });
  useEffect(() => {
    let alive = true;
    if (!horseId || !RACE_FLOW_V2) return;
    tournamentApi.raceDatesOf(horseId).then((races) => { if (alive) setLoaded({ horseId, races }); }, () => { if (alive) setLoaded({ horseId, races: [] }); });
    return () => { alive = false; };
  }, [horseId]);
  return loaded.horseId === horseId ? loaded.races : [];
};

export const highIntensityBlock = (races: RaceTournament[], startIso: string, weeks: number, intensity: string) => {
  if (!startIso || !isHighIntensity(intensity)) return null;
  const end = toIsoDay(addDays(parseIso(startIso), Math.max(1, weeks) * 7 - 1));
  const hit = restWindowConflict(startIso, end, races.map((r) => r.raceDate));
  if (!hit) return null;
  const race = races.find((r) => r.raceDate === hit);
  return `Ngựa thi ${race?.name ?? 'giải đấu'} ngày ${fmtDate(hit)}: không lập cường độ Cao trong ${PRE_RACE_REST_DAYS} ngày trước ngày thi.`;
};
