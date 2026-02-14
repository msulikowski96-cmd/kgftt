export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';

export interface ActivityLevelOption {
  value: ActivityLevel;
  label: string;
  description: string;
  multiplier: number;
}

export interface UserData {
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: ActivityLevel;
  waist?: number;
  hip?: number;
  neck?: number;
}

export interface BMIZone {
  label: string;
  color: string;
  range: string;
  description: string;
}

export interface MetabolicResults {
  bmi: number;
  bmiZone: BMIZone;
  bmr: number;
  tdee: number;
  whtr?: number;
  whtrZone?: BMIZone;
  bai?: number;
  baiZone?: BMIZone;
  bodyFat?: number;
  bodyFatCategory?: string;
  lbm?: number;
  idealWeight: { min: number; max: number };
  waterIntake: number;
  bmiPrime: number;
  ponderalIndex: number;
}

export interface Measurement {
  id: string;
  date: Date;
  weight: number;
  bmi: number;
  bodyFat?: number;
  waist?: number;
  notes?: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}

export interface FoodItem {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: FoodItem[];
}

export interface Recommendation {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  category: 'nutrition' | 'exercise' | 'hydration' | 'sleep' | 'general';
}
