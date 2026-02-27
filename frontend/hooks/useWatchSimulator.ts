import { useState, useEffect } from 'react';

export interface Vitals {
  heartRate: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  bloodPressure: string;
  lastSync: Date;
}

const DEFAULT_VITALS: Vitals = {
  heartRate: 75,
  spo2: 98,
  systolic: 120,
  diastolic: 80,
  bloodPressure: '120/80',
  lastSync: new Date(),
};

export function useWatchSimulator() {
  const [vitals, setVitals] = useState<Vitals>(DEFAULT_VITALS);
  const [lastAlertSent, setLastAlertSent] = useState<Record<string, number>>({});

  const checkAlerts = async (currentVitals: Vitals) => {
    const alerts = [];
    const now = Date.now();
    const COOLDOWN = 60000; // 1 minute cooldown per alert type

    if (currentVitals.heartRate > 100 || currentVitals.heartRate < 60) {
      alerts.push({ type: 'Heart Rate', value: currentVitals.heartRate, message: currentVitals.heartRate > 100 ? 'High heart rate detected' : 'Low heart rate detected' });
    }
    if (currentVitals.spo2 < 95) {
      alerts.push({ type: 'SpO2', value: currentVitals.spo2, message: 'Critical SpO2 level detected' });
    }
    const [sys, dia] = currentVitals.bloodPressure.split('/').map(Number);
    if (sys > 130 || dia > 90 || sys < 90 || dia < 60) {
      alerts.push({ type: 'Blood Pressure', value: currentVitals.bloodPressure, message: 'Abnormal blood pressure detected' });
    }

    for (const alert of alerts) {
      if (!lastAlertSent[alert.type] || now - lastAlertSent[alert.type] > COOLDOWN) {
        try {
          await fetch('/api/vitals/alert', {
            method: 'POST',
            body: JSON.stringify(alert),
            headers: { 'Content-Type': 'application/json' },
          });
          setLastAlertSent(prev => ({ ...prev, [alert.type]: now }));
        } catch (error) {
          console.error('Failed to send vital alert:', error);
        }
      }
    }
  };

  const updateVitals = (direction: 'increase' | 'decrease' | 'reset') => {
    setVitals(prev => {
      let heartRate = prev.heartRate;
      let spo2 = prev.spo2;
      let systolic = prev.systolic;
      let diastolic = prev.diastolic;

      if (direction === 'reset') {
        return DEFAULT_VITALS;
      } else if (direction === 'decrease') {
        heartRate = Math.max(40, heartRate - 5);
        spo2 = Math.max(85, spo2 - 2);
        systolic = Math.max(80, systolic - 8);
        diastolic = Math.max(50, diastolic - 5);
      } else if (direction === 'increase') {
        heartRate = Math.min(140, heartRate + 8);
        spo2 = Math.min(100, spo2 + 1);
        systolic = Math.min(160, systolic + 10);
        diastolic = Math.min(100, diastolic + 8);
      }

      const newVitals = {
        heartRate,
        spo2,
        systolic,
        diastolic,
        bloodPressure: `${systolic}/${diastolic}`,
        lastSync: new Date(),
      };

      checkAlerts(newVitals);
      return newVitals;
    });
  };

  return {
    vitals,
    isManual: true, // Always considered "manual" now as it doesn't auto-update
    decreaseVitals: () => updateVitals('decrease'),
    increaseVitals: () => updateVitals('increase'),
    resetToAuto: () => updateVitals('reset') // Renamed internally to reset vitals to normal
  };
}
