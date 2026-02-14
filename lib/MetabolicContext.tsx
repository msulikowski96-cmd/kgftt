import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { UserData, MetabolicResults, Recommendation, Measurement, Meal, MacroTargets } from '@/lib/types';
import { useMetabolicCalculations, generateRecommendations } from '@/lib/useMetabolicCalculations';
import { useMeasurementHistory } from '@/lib/useMeasurementHistory';
import { useMacroPlanner } from '@/lib/useMacroPlanner';

interface MetabolicContextValue {
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
  results: MetabolicResults | null;
  recommendations: Recommendation[];
  measurements: Measurement[];
  addMeasurement: (userData: UserData, notes?: string) => void;
  deleteMeasurement: (id: string) => void;
  clearHistory: () => void;
  getProgress: (days: number) => { weightChange: number; bmiChange: number } | null;
  meals: Meal[];
  macroTargets: MacroTargets;
  addFoodToMeal: (mealId: string, food: { name: string; amount: number; unit: string }) => void;
  removeFoodFromMeal: (mealId: string, foodIndex: number) => void;
  getDailyTotals: () => { calories: number; protein: number; carbs: number; fat: number };
  getRemainingMacros: () => { calories: number; protein: number; carbs: number; fat: number };
  getMacroPercentages: () => { protein: number; carbs: number; fat: number };
  generateMealPlan: (tdee: number, goal: 'maintain' | 'lose' | 'gain') => void;
  isLoading: boolean;
}

const MetabolicContext = createContext<MetabolicContextValue | null>(null);

export function MetabolicProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const results = useMetabolicCalculations(userData);
  const { measurements, addMeasurement, deleteMeasurement, clearHistory, getProgress, isLoading: historyLoading } = useMeasurementHistory();
  const { meals, macroTargets, addFoodToMeal, removeFoodFromMeal, getDailyTotals, getRemainingMacros, getMacroPercentages, generateMealPlan, isLoading: mealsLoading } = useMacroPlanner();

  const recommendations = useMemo(() => {
    if (results && userData) return generateRecommendations(results, userData);
    return [];
  }, [results, userData]);

  const value = useMemo(() => ({
    userData,
    setUserData,
    results,
    recommendations,
    measurements,
    addMeasurement,
    deleteMeasurement,
    clearHistory,
    getProgress,
    meals,
    macroTargets,
    addFoodToMeal,
    removeFoodFromMeal,
    getDailyTotals,
    getRemainingMacros,
    getMacroPercentages,
    generateMealPlan,
    isLoading: historyLoading || mealsLoading,
  }), [userData, results, recommendations, measurements, meals, macroTargets, historyLoading, mealsLoading, addMeasurement, deleteMeasurement, clearHistory, getProgress, addFoodToMeal, removeFoodFromMeal, getDailyTotals, getRemainingMacros, getMacroPercentages, generateMealPlan]);

  return (
    <MetabolicContext.Provider value={value}>
      {children}
    </MetabolicContext.Provider>
  );
}

export function useMetabolic() {
  const context = useContext(MetabolicContext);
  if (!context) throw new Error('useMetabolic must be used within MetabolicProvider');
  return context;
}
