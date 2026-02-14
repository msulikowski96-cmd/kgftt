import { useState, useEffect, useCallback } from 'react';
import type { MacroTargets, Meal, FoodItem } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@metabolic_ai_meals';
const TARGETS_KEY = '@metabolic_ai_targets';

const calculateMacrosFromCalories = (calories: number): MacroTargets => {
  const proteinPercent = 30;
  const carbsPercent = 40;
  const fatPercent = 30;
  return {
    calories,
    protein: Math.round((calories * proteinPercent / 100) / 4),
    carbs: Math.round((calories * carbsPercent / 100) / 4),
    fat: Math.round((calories * fatPercent / 100) / 9),
    proteinPercent,
    carbsPercent,
    fatPercent
  };
};

export const foodDatabase: { name: string; label: string; calories: number; protein: number; carbs: number; fat: number }[] = [
  { name: 'chicken_breast', label: 'Piers z kurczaka', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'rice', label: 'Ryz bialy', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'oats', label: 'Platki owsiane', calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  { name: 'eggs', label: 'Jajka', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: 'salmon', label: 'Losos', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'broccoli', label: 'Brokuly', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'banana', label: 'Banan', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'greek_yogurt', label: 'Jogurt grecki', calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: 'almonds', label: 'Migdaly', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: 'sweet_potato', label: 'Batat', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: 'tuna', label: 'Tunczyk', calories: 132, protein: 28, carbs: 0, fat: 1 },
  { name: 'avocado', label: 'Awokado', calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: 'spinach', label: 'Szpinak', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: 'quinoa', label: 'Komosa ryzowa', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: 'cottage_cheese', label: 'Serek wiejski', calories: 98, protein: 11, carbs: 3.4, fat: 4.3 }
];

const foodNutrients: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
foodDatabase.forEach(f => { foodNutrients[f.name] = { calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat }; });

export const useMacroPlanner = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [macroTargets, setMacroTargets] = useState<MacroTargets>(calculateMacrosFromCalories(2000));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedMeals = await AsyncStorage.getItem(STORAGE_KEY);
        const storedTargets = await AsyncStorage.getItem(TARGETS_KEY);
        if (storedMeals) setMeals(JSON.parse(storedMeals));
        if (storedTargets) setMacroTargets(JSON.parse(storedTargets));
      } catch (error) {
        console.error('Error loading macro planner data:', error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
        await AsyncStorage.setItem(TARGETS_KEY, JSON.stringify(macroTargets));
      } catch (error) {
        console.error('Error saving macro planner data:', error);
      }
    };
    if (!isLoading) saveData();
  }, [meals, macroTargets, isLoading]);

  const addFoodToMeal = useCallback((mealId: string, food: Omit<FoodItem, 'calories' | 'protein' | 'carbs' | 'fat'>) => {
    const fd = foodNutrients[food.name] || { calories: 100, protein: 5, carbs: 15, fat: 3 };
    const mul = food.amount / 100;
    const fullItem: FoodItem = {
      ...food,
      calories: Math.round(fd.calories * mul),
      protein: Math.round(fd.protein * mul * 10) / 10,
      carbs: Math.round(fd.carbs * mul * 10) / 10,
      fat: Math.round(fd.fat * mul * 10) / 10
    };
    setMeals(prev => prev.map(m => {
      if (m.id === mealId) {
        const updatedFoods = [...m.foods, fullItem];
        return {
          ...m,
          foods: updatedFoods,
          calories: updatedFoods.reduce((s, f) => s + f.calories, 0),
          protein: Math.round(updatedFoods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
          carbs: Math.round(updatedFoods.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
          fat: Math.round(updatedFoods.reduce((s, f) => s + f.fat, 0) * 10) / 10
        };
      }
      return m;
    }));
  }, []);

  const removeFoodFromMeal = useCallback((mealId: string, foodIndex: number) => {
    setMeals(prev => prev.map(m => {
      if (m.id === mealId) {
        const updatedFoods = m.foods.filter((_, i) => i !== foodIndex);
        return {
          ...m,
          foods: updatedFoods,
          calories: updatedFoods.reduce((s, f) => s + f.calories, 0),
          protein: Math.round(updatedFoods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
          carbs: Math.round(updatedFoods.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
          fat: Math.round(updatedFoods.reduce((s, f) => s + f.fat, 0) * 10) / 10
        };
      }
      return m;
    }));
  }, []);

  const getDailyTotals = useCallback(() => {
    return meals.reduce((t, m) => ({
      calories: t.calories + m.calories,
      protein: Math.round((t.protein + m.protein) * 10) / 10,
      carbs: Math.round((t.carbs + m.carbs) * 10) / 10,
      fat: Math.round((t.fat + m.fat) * 10) / 10
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [meals]);

  const getRemainingMacros = useCallback(() => {
    const t = getDailyTotals();
    return {
      calories: macroTargets.calories - t.calories,
      protein: Math.round((macroTargets.protein - t.protein) * 10) / 10,
      carbs: Math.round((macroTargets.carbs - t.carbs) * 10) / 10,
      fat: Math.round((macroTargets.fat - t.fat) * 10) / 10
    };
  }, [getDailyTotals, macroTargets]);

  const getMacroPercentages = useCallback(() => {
    const t = getDailyTotals();
    const totalCal = t.calories || 1;
    return {
      protein: Math.round((t.protein * 4 / totalCal) * 100),
      carbs: Math.round((t.carbs * 4 / totalCal) * 100),
      fat: Math.round((t.fat * 9 / totalCal) * 100)
    };
  }, [getDailyTotals]);

  const generateMealPlan = useCallback((tdee: number, goal: 'maintain' | 'lose' | 'gain') => {
    let targetCalories = tdee;
    if (goal === 'lose') targetCalories -= 500;
    if (goal === 'gain') targetCalories += 300;

    const newTargets = calculateMacrosFromCalories(targetCalories);
    setMacroTargets(newTargets);

    const sampleMeals: Meal[] = [
      {
        id: 'breakfast', name: 'Sniadanie', time: '08:00',
        calories: Math.round(targetCalories * 0.25),
        protein: Math.round(newTargets.protein * 0.25),
        carbs: Math.round(newTargets.carbs * 0.3),
        fat: Math.round(newTargets.fat * 0.2),
        foods: [
          { name: 'oats', amount: 80, unit: 'g', calories: 311, protein: 13.5, carbs: 53, fat: 5.5 },
          { name: 'banana', amount: 100, unit: 'g', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
          { name: 'greek_yogurt', amount: 150, unit: 'g', calories: 88, protein: 15, carbs: 5.4, fat: 0.6 }
        ]
      },
      {
        id: 'lunch', name: 'Lunch', time: '13:00',
        calories: Math.round(targetCalories * 0.35),
        protein: Math.round(newTargets.protein * 0.35),
        carbs: Math.round(newTargets.carbs * 0.35),
        fat: Math.round(newTargets.fat * 0.35),
        foods: [
          { name: 'chicken_breast', amount: 150, unit: 'g', calories: 248, protein: 46.5, carbs: 0, fat: 5.4 },
          { name: 'rice', amount: 100, unit: 'g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
          { name: 'broccoli', amount: 150, unit: 'g', calories: 51, protein: 4.2, carbs: 10.5, fat: 0.6 }
        ]
      },
      {
        id: 'dinner', name: 'Kolacja', time: '19:00',
        calories: Math.round(targetCalories * 0.3),
        protein: Math.round(newTargets.protein * 0.3),
        carbs: Math.round(newTargets.carbs * 0.25),
        fat: Math.round(newTargets.fat * 0.35),
        foods: [
          { name: 'salmon', amount: 150, unit: 'g', calories: 312, protein: 30, carbs: 0, fat: 19.5 },
          { name: 'sweet_potato', amount: 150, unit: 'g', calories: 129, protein: 2.4, carbs: 30, fat: 0.15 },
          { name: 'spinach', amount: 100, unit: 'g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }
        ]
      },
      {
        id: 'snack', name: 'Przekaska', time: '16:00',
        calories: Math.round(targetCalories * 0.1),
        protein: Math.round(newTargets.protein * 0.1),
        carbs: Math.round(newTargets.carbs * 0.1),
        fat: Math.round(newTargets.fat * 0.1),
        foods: [
          { name: 'almonds', amount: 30, unit: 'g', calories: 174, protein: 6.3, carbs: 6.6, fat: 15 }
        ]
      }
    ];

    setMeals(sampleMeals);
  }, []);

  return { meals, macroTargets, addFoodToMeal, removeFoodFromMeal, getDailyTotals, getRemainingMacros, getMacroPercentages, generateMealPlan, isLoading };
};
