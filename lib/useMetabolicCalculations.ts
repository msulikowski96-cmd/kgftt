import { useMemo } from 'react';
import type {
  UserData,
  MetabolicResults,
  BMIZone,
  Recommendation,
  ActivityLevelOption
} from '@/lib/types';

export const activityLevels: ActivityLevelOption[] = [
  { value: 'sedentary', label: 'Siedzacy', description: 'Brak aktywnosci fizycznej', multiplier: 1.2 },
  { value: 'light', label: 'Lekka aktywnosc', description: '1-2 razy w tygodniu', multiplier: 1.375 },
  { value: 'moderate', label: 'Umiarkowana', description: '3-4 razy w tygodniu', multiplier: 1.55 },
  { value: 'active', label: 'Aktywny', description: '5-6 razy w tygodniu', multiplier: 1.725 },
  { value: 'very-active', label: 'Bardzo aktywny', description: 'Codziennie + praca fizyczna', multiplier: 1.9 }
];

export const getBMIZone = (bmi: number): BMIZone => {
  if (bmi < 16) return { label: 'Wyglodzenie', color: '#8B0000', range: '< 16', description: 'Powazne niedozywienie - skonsultuj sie z lekarzem' };
  if (bmi < 17) return { label: 'Wychudzenie', color: '#CD5C5C', range: '16 - 16.9', description: 'Znaczna niedowaga - wymaga interwencji' };
  if (bmi < 18.5) return { label: 'Niedowaga', color: '#E8A87C', range: '17 - 18.4', description: 'Niedowaga - rozwaz zwiekszenie masy ciala' };
  if (bmi < 25) return { label: 'Prawidlowa waga', color: '#27AE60', range: '18.5 - 24.9', description: 'Twoja waga jest w normie' };
  if (bmi < 30) return { label: 'Nadwaga', color: '#F39C12', range: '25 - 29.9', description: 'Nadwaga - rozwaz zwiekszenie aktywnosci' };
  if (bmi < 35) return { label: 'Otylosc I', color: '#E67E22', range: '30 - 34.9', description: 'Otylosc - skonsultuj sie z lekarzem' };
  if (bmi < 40) return { label: 'Otylosc II', color: '#E74C3C', range: '35 - 39.9', description: 'Znaczna otylosc - wymaga interwencji' };
  return { label: 'Otylosc III', color: '#8B0000', range: '>= 40', description: 'Powazna otylosc - natychmiastowa konsultacja' };
};

export const getWHtRZone = (whtr: number, gender: 'male' | 'female'): BMIZone => {
  const t = gender === 'male'
    ? { low: 0.35, healthy: 0.43, overweight: 0.53, obese: 0.58 }
    : { low: 0.35, healthy: 0.42, overweight: 0.49, obese: 0.54 };
  if (whtr < t.low) return { label: 'Niedowaga', color: '#E8A87C', range: `< ${t.low}`, description: 'Zbyt niski stosunek talii do wzrostu' };
  if (whtr < t.healthy) return { label: 'Zdrowy', color: '#27AE60', range: `${t.low} - ${t.healthy}`, description: 'Prawidlowy stosunek' };
  if (whtr < t.overweight) return { label: 'Nadwaga', color: '#F39C12', range: `${t.healthy} - ${t.overweight}`, description: 'Zwiekszone ryzyko zdrowotne' };
  if (whtr < t.obese) return { label: 'Otylosc', color: '#E74C3C', range: `${t.overweight} - ${t.obese}`, description: 'Wysokie ryzyko zdrowotne' };
  return { label: 'Powazna otylosc', color: '#8B0000', range: `>= ${t.obese}`, description: 'Bardzo wysokie ryzyko zdrowotne' };
};

export const getBAIZone = (bai: number, gender: 'male' | 'female'): BMIZone => {
  const t = gender === 'male'
    ? { low: 8, healthy: 16, overweight: 20, obese: 25 }
    : { low: 18, healthy: 26, overweight: 31, obese: 36 };
  if (bai < t.low) return { label: 'Niedowaga', color: '#E8A87C', range: `< ${t.low}%`, description: 'Zbyt niski poziom tkanki tluszczowej' };
  if (bai < t.healthy) return { label: 'Zdrowy', color: '#27AE60', range: `${t.low}% - ${t.healthy}%`, description: 'Prawidlowy poziom' };
  if (bai < t.overweight) return { label: 'Nadwaga', color: '#F39C12', range: `${t.healthy}% - ${t.overweight}%`, description: 'Zwiekszony poziom' };
  if (bai < t.obese) return { label: 'Otylosc', color: '#E74C3C', range: `${t.overweight}% - ${t.obese}%`, description: 'Wysoki poziom' };
  return { label: 'Powazna otylosc', color: '#8B0000', range: `>= ${t.obese}%`, description: 'Bardzo wysoki poziom' };
};

export const getBodyFatCategory = (bodyFat: number, gender: 'male' | 'female'): string => {
  const cats = gender === 'male'
    ? [{ max: 6, label: 'Niezbedny tluszcz' }, { max: 14, label: 'Sportowiec' }, { max: 18, label: 'Fitness' }, { max: 25, label: 'Przecietny' }, { max: 100, label: 'Otyly' }]
    : [{ max: 14, label: 'Niezbedny tluszcz' }, { max: 21, label: 'Sportowiec' }, { max: 25, label: 'Fitness' }, { max: 32, label: 'Przecietny' }, { max: 100, label: 'Otyly' }];
  return cats.find(c => bodyFat <= c.max)?.label || 'Nieznany';
};

export const useMetabolicCalculations = (userData: UserData | null): MetabolicResults | null => {
  return useMemo(() => {
    if (!userData) return null;
    const { height, weight, age, gender, activityLevel, waist, hip, neck } = userData;
    const heightM = height / 100;
    const isMale = gender === 'male';

    const bmi = weight / (heightM * heightM);
    const bmiZone = getBMIZone(bmi);

    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = isMale ? bmr + 5 : bmr - 161;

    const activity = activityLevels.find(a => a.value === activityLevel);
    const tdee = bmr * (activity?.multiplier || 1.2);

    let whtr: number | undefined;
    let whtrZone: BMIZone | undefined;
    if (waist && waist > 0) {
      whtr = waist / height;
      whtrZone = getWHtRZone(whtr, gender);
    }

    let bai: number | undefined;
    let baiZone: BMIZone | undefined;
    if (hip && hip > 0) {
      bai = (hip / Math.pow(heightM, 1.5)) - 18;
      baiZone = getBAIZone(bai, gender);
    }

    let bodyFat: number | undefined;
    let bodyFatCategory: string | undefined;
    if (waist && neck && waist > 0 && neck > 0) {
      if (isMale) {
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      } else if (hip && hip > 0) {
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
      }
      if (bodyFat && bodyFat > 0 && bodyFat < 60) {
        bodyFatCategory = getBodyFatCategory(bodyFat, gender);
      }
    }

    const lbm = bodyFat ? weight * (1 - bodyFat / 100) : undefined;

    let idealWeightMin: number;
    let idealWeightMax: number;
    if (isMale) {
      idealWeightMin = 50 + 0.9 * (height - 152);
      idealWeightMax = 52 + 0.9 * (height - 152);
    } else {
      idealWeightMin = 45.5 + 0.9 * (height - 152);
      idealWeightMax = 47.5 + 0.9 * (height - 152);
    }

    const waterIntake = weight * 35;
    const bmiPrime = bmi / 25;
    const ponderalIndex = weight / (heightM * heightM * heightM);

    return {
      bmi: Math.round(bmi * 10) / 10,
      bmiZone,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      whtr: whtr ? Math.round(whtr * 100) / 100 : undefined,
      whtrZone,
      bai: bai ? Math.round(bai * 10) / 10 : undefined,
      baiZone,
      bodyFat: bodyFat ? Math.round(bodyFat * 10) / 10 : undefined,
      bodyFatCategory,
      lbm: lbm ? Math.round(lbm * 10) / 10 : undefined,
      idealWeight: { min: Math.round(idealWeightMin), max: Math.round(idealWeightMax) },
      waterIntake: Math.round(waterIntake),
      bmiPrime: Math.round(bmiPrime * 100) / 100,
      ponderalIndex: Math.round(ponderalIndex * 10) / 10
    };
  }, [userData]);
};

export const generateRecommendations = (results: MetabolicResults, userData: UserData): Recommendation[] => {
  const recs: Recommendation[] = [];
  const { bmiZone, tdee, bodyFat, whtrZone } = results;

  if (bmiZone.label.includes('Niedowaga') || bmiZone.label.includes('Wychudzenie')) {
    recs.push({ icon: 'nutrition', title: 'Zwieksz kalorycznosc', description: `Twoje zapotrzebowanie to okolo ${tdee} kcal. Rozwaz zwiekszenie o 300-500 kcal dziennie.`, accentColor: '#E8A87C', category: 'nutrition' });
  } else if (bmiZone.label.includes('Nadwaga') || bmiZone.label.includes('Otylosc')) {
    recs.push({ icon: 'fitness-center', title: 'Deficyt kaloryczny', description: `Przy TDEE ${tdee} kcal, rozwaz redukcje o 300-500 kcal dziennie. To pozwoli na zdrowa utrate 0.5-1 kg tygodniowo.`, accentColor: '#E74C3C', category: 'nutrition' });
  } else {
    recs.push({ icon: 'checkmark-circle', title: 'Utrzymuj balans', description: `Twoje BMI jest w normie! Utrzymuj okolo ${tdee} kcal dziennie.`, accentColor: '#27AE60', category: 'nutrition' });
  }

  if (bodyFat) {
    recs.push({ icon: 'body', title: 'Sklad ciala', description: `Twoj poziom tkanki tluszczowej to ${bodyFat}%. ${results.bodyFatCategory}. Regularnie monitoruj zmiany.`, accentColor: '#9B59B6', category: 'general' });
  }

  if (whtrZone) {
    recs.push({ icon: 'resize', title: 'Obwod talii', description: `Stosunek talii do wzrostu: ${results.whtr}. ${whtrZone.description}.`, accentColor: '#3498DB', category: 'general' });
  }

  recs.push({ icon: 'walk', title: 'Aktywnosc fizyczna', description: 'Zalecane jest co najmniej 150 minut umiarkowanej aktywnosci tygodniowo lub 75 minut intensywnych cwiczen.', accentColor: '#E67E22', category: 'exercise' });
  recs.push({ icon: 'water', title: 'Nawodnienie', description: `Pij co najmniej ${(results.waterIntake / 1000).toFixed(1)} litra wody dziennie.`, accentColor: '#3498DB', category: 'hydration' });
  recs.push({ icon: 'moon', title: 'Regeneracja', description: 'Sen 7-9 godzin dziennie wspomaga metabolizm i regulacje hormonow.', accentColor: '#9B59B6', category: 'sleep' });

  const proteinTarget = Math.round(userData.weight * 1.6);
  recs.push({ icon: 'restaurant', title: 'Bialko', description: `Spozywaj okolo ${proteinTarget}g bialka dziennie (1.6g/kg masy ciala).`, accentColor: '#27AE60', category: 'nutrition' });

  return recs;
};
