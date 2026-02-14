import { useState, useEffect, useCallback } from 'react';
import type { Measurement, UserData } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@metabolic_ai_history';

export const useMeasurementHistory = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMeasurements = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const withDates = parsed.map((m: Measurement & { date: string }) => ({
            ...m,
            date: new Date(m.date)
          }));
          setMeasurements(withDates);
        }
      } catch (error) {
        console.error('Error loading measurement history:', error);
      }
      setIsLoading(false);
    };
    loadMeasurements();
  }, []);

  useEffect(() => {
    const saveMeasurements = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
      } catch (error) {
        console.error('Error saving measurement history:', error);
      }
    };
    if (!isLoading) {
      saveMeasurements();
    }
  }, [measurements, isLoading]);

  const addMeasurement = useCallback((userData: UserData, notes?: string) => {
    const heightM = userData.height / 100;
    const bmi = userData.weight / (heightM * heightM);

    let bodyFat: number | undefined;
    if (userData.waist && userData.neck) {
      if (userData.gender === 'male') {
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(userData.waist - userData.neck) + 0.15456 * Math.log10(userData.height)) - 450;
      } else if (userData.hip) {
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(userData.waist + userData.hip - userData.neck) + 0.22100 * Math.log10(userData.height)) - 450;
      }
      if (bodyFat && (bodyFat < 0 || bodyFat > 60)) {
        bodyFat = undefined;
      }
    }

    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      date: new Date(),
      weight: userData.weight,
      bmi: Math.round(bmi * 10) / 10,
      bodyFat: bodyFat ? Math.round(bodyFat * 10) / 10 : undefined,
      waist: userData.waist,
      notes
    };

    setMeasurements(prev => [newMeasurement, ...prev]);
  }, []);

  const deleteMeasurement = useCallback((id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setMeasurements([]);
  }, []);

  const getProgress = useCallback((days: number) => {
    if (measurements.length < 2) return null;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const recent = measurements.filter(m => m.date >= cutoffDate);
    if (recent.length < 2) return null;
    const oldest = recent[recent.length - 1];
    const newest = recent[0];
    return {
      weightChange: Math.round((newest.weight - oldest.weight) * 10) / 10,
      bmiChange: Math.round((newest.bmi - oldest.bmi) * 10) / 10
    };
  }, [measurements]);

  return { measurements, addMeasurement, deleteMeasurement, clearHistory, getProgress, isLoading };
};
