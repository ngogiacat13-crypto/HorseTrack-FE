import { HorseRegistrationRecord } from './mockData';

const HORSE_REGISTRATIONS_KEY = 'horseTrack.horseRegistrations';

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export const saveHorseRegistration = (registration: HorseRegistrationRecord) => {
  if (!canUseStorage()) return;

  const existing = window.localStorage.getItem(HORSE_REGISTRATIONS_KEY);
  const registrations: HorseRegistrationRecord[] = existing ? JSON.parse(existing) : [];
  window.localStorage.setItem(
    HORSE_REGISTRATIONS_KEY,
    JSON.stringify([...registrations, registration]),
  );
};

export const getHorseRegistrations = (): HorseRegistrationRecord[] => {
  if (!canUseStorage()) return [];

  const existing = window.localStorage.getItem(HORSE_REGISTRATIONS_KEY);
  return existing ? JSON.parse(existing) : [];
};
