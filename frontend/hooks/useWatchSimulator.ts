import { useState, useEffect, useCallback } from 'react';

export interface Vitals {
  heartRate: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  bloodPressure: string;
  lastSync: Date;
}

type SimulatorMode = 'NORMAL' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateRandomNormalVitals = (): Vitals => {
  const systolic = getRandomInt(115, 125);
  const diastolic = getRandomInt(75, 85);
  return {
    heartRate: getRandomInt(68, 82),
    spo2: getRandomInt(97, 99),
    systolic,
    diastolic,
    bloodPressure: `${systolic}/${diastolic}`,
    lastSync: new Date(),
  };
};

// Static default to match server rendering
const DEFAULT_VITALS: Vitals = {
  heartRate: 72,
  spo2: 98,
  systolic: 120,
  diastolic: 80,
  bloodPressure: '120/80',
  lastSync: new Date(),
};

export function useWatchSimulator() {
  const [vitals, setVitals] = useState<Vitals>(DEFAULT_VITALS);
  const [mode, setMode] = useState<SimulatorMode>('NORMAL');
  const [mounted, setMounted] = useState(false);

  const syncVitalsToDB = useCallback(async (currentVitals: Vitals) => {
    try {
      await fetch('/api/vitals/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heartRate: currentVitals.heartRate,
          spo2: currentVitals.spo2,
          systolic: currentVitals.systolic,
          diastolic: currentVitals.diastolic
        }),
      });
    } catch (error) {
      console.error('Failed to sync vitals to DB:', error);
    }
  }, []);

  // Handle initialization on client only to avoid hydration mismatch
  useEffect(() => {
    if (!mounted) {
      const initialVitals = generateRandomNormalVitals();
      setVitals(initialVitals);
      setMounted(true);
      syncVitalsToDB(initialVitals);
    }
  }, [mounted, syncVitalsToDB]);

  const updateVitals = (direction: 'increase' | 'decrease' | 'reset') => {
    setVitals(prev => {
      let heartRate = prev.heartRate;
      let spo2 = prev.spo2;
      let systolic = prev.systolic;
      let diastolic = prev.diastolic;
      let newMode: SimulatorMode = mode;

      if (direction === 'reset') {
        const resetVitals = generateRandomNormalVitals();
        setMode('NORMAL');
        syncVitalsToDB(resetVitals);
        return resetVitals;
      } else if (direction === 'decrease') {
        newMode = 'CRITICAL_LOW';
        heartRate = getRandomInt(45, 55);
        spo2 = getRandomInt(88, 92);
        systolic = getRandomInt(85, 95);
        diastolic = getRandomInt(55, 65);
      } else if (direction === 'increase') {
        newMode = 'CRITICAL_HIGH';
        heartRate = getRandomInt(110, 130);
        spo2 = getRandomInt(95, 98);
        systolic = getRandomInt(165, 185);
        diastolic = getRandomInt(105, 115);
      }

      setMode(newMode);

      const newVitals = {
        heartRate,
        spo2,
        systolic,
        diastolic,
        bloodPressure: `${systolic}/${diastolic}`,
        lastSync: new Date(),
      };

      syncVitalsToDB(newVitals);
      return newVitals;
    });
  };

  return {
    vitals,
    isManual: mode !== 'NORMAL',
    decreaseVitals: () => updateVitals('decrease'),
    increaseVitals: () => updateVitals('increase'),
    resetToAuto: () => updateVitals('reset')
  };
}
