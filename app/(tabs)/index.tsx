import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useMetabolic } from "@/lib/MetabolicContext";
import { activityLevels } from "@/lib/useMetabolicCalculations";
import type { UserData, ActivityLevel } from "@/lib/types";
import Colors from "@/constants/colors";

function ResultsView() {
  const { results, userData, setUserData, addMeasurement } = useMetabolic();
  const insets = useSafeAreaInsets();

  if (!results || !userData) return null;

  const handleSave = () => {
    addMeasurement(userData);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Zapisano", "Pomiar zostal dodany do historii.");
  };

  const handleBack = () => {
    setUserData(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
          paddingBottom: Platform.OS === "web" ? 34 + 80 : insets.bottom + 100,
          paddingHorizontal: 16,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsHeader}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.resultsTitle}>Twoje wyniki</Text>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="bookmark-outline" size={22} color={Colors.light.tint} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Glowne wskazniki</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="BMI"
            value={results.bmi.toString()}
            badge={results.bmiZone.label}
            badgeColor={results.bmiZone.color}
            icon="body-outline"
          />
          <MetricCard
            title="BMR"
            value={results.bmr.toString()}
            unit="kcal"
            subtitle="Podstawowa przemiana materii"
            icon="flame-outline"
          />
          <MetricCard
            title="TDEE"
            value={results.tdee.toString()}
            unit="kcal"
            subtitle="Calkowite zapotrzebowanie"
            icon="fitness-outline"
          />
        </View>

        {(results.whtr || results.bai || results.bodyFat) && (
          <>
            <Text style={styles.sectionLabel}>Zaawansowane wskazniki</Text>
            <View style={styles.metricsGrid}>
              {results.whtr !== undefined && results.whtrZone && (
                <MetricCard
                  title="WHtR"
                  value={results.whtr.toString()}
                  badge={results.whtrZone.label}
                  badgeColor={results.whtrZone.color}
                  subtitle="Talia / Wzrost"
                  icon="resize-outline"
                />
              )}
              {results.bai !== undefined && results.baiZone && (
                <MetricCard
                  title="BAI"
                  value={results.bai.toString()}
                  unit="%"
                  badge={results.baiZone.label}
                  badgeColor={results.baiZone.color}
                  icon="analytics-outline"
                />
              )}
              {results.bodyFat !== undefined && (
                <MetricCard
                  title="Tkanka tluszczowa"
                  value={results.bodyFat.toString()}
                  unit="%"
                  subtitle={results.bodyFatCategory}
                  icon="person-outline"
                />
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Dodatkowe informacje</Text>
        <View style={styles.infoRow}>
          <InfoChip icon="water-outline" label="Woda dziennie" value={`${(results.waterIntake / 1000).toFixed(1)} L`} color="#06B6D4" />
          <InfoChip icon="scale-outline" label="Idealna waga" value={`${results.idealWeight.min}-${results.idealWeight.max} kg`} color="#10B981" />
        </View>
        <View style={styles.infoRow}>
          {results.lbm !== undefined && (
            <InfoChip icon="barbell-outline" label="Masa beztluszczowa" value={`${results.lbm} kg`} color="#F59E0B" />
          )}
          <InfoChip icon="trending-up-outline" label="BMI Prime" value={results.bmiPrime.toString()} color="#8B5CF6" />
        </View>

        <Text style={styles.sectionLabel}>Zakresy kaloryczne</Text>
        <View style={styles.calorieRow}>
          <View style={[styles.calorieCard, { backgroundColor: "#FEE2E2" }]}>
            <Text style={styles.calorieLabel}>Redukcja</Text>
            <Text style={styles.calorieValue}>{results.tdee - 500}</Text>
            <Text style={styles.calorieUnit}>kcal</Text>
            <Text style={styles.calorieNote}>~0.5 kg/tyg</Text>
          </View>
          <View style={[styles.calorieCard, { backgroundColor: Colors.light.successLight }]}>
            <Text style={styles.calorieLabel}>Utrzymanie</Text>
            <Text style={styles.calorieValue}>{results.tdee}</Text>
            <Text style={styles.calorieUnit}>kcal</Text>
            <Text style={styles.calorieNote}>Aktualna waga</Text>
          </View>
          <View style={[styles.calorieCard, { backgroundColor: Colors.light.infoLight }]}>
            <Text style={styles.calorieLabel}>Wzrost</Text>
            <Text style={styles.calorieValue}>{results.tdee + 300}</Text>
            <Text style={styles.calorieUnit}>kcal</Text>
            <Text style={styles.calorieNote}>~0.3 kg/tyg</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MetricCard({ title, value, unit, subtitle, badge, badgeColor, icon }: {
  title: string; value: string; unit?: string; subtitle?: string;
  badge?: string; badgeColor?: string; icon: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={styles.metricTitleRow}>
          <Ionicons name={icon as any} size={18} color={Colors.light.textSecondary} />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        {unit && <Text style={styles.metricUnit}>{unit}</Text>}
      </View>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function InfoChip({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.infoChipValue}>{value}</Text>
      <Text style={styles.infoChipLabel}>{label}</Text>
    </View>
  );
}

function CalculatorForm() {
  const { setUserData } = useMetabolic();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [neck, setNeck] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!height || Number(height) < 50 || Number(height) > 300) newErrors.height = "Wzrost: 50-300 cm";
    if (!weight || Number(weight) < 20 || Number(weight) > 500) newErrors.weight = "Waga: 20-500 kg";
    if (!age || Number(age) < 10 || Number(age) > 120) newErrors.age = "Wiek: 10-120 lat";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    if (validate()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setUserData({
        height: Number(height),
        weight: Number(weight),
        age: Number(age),
        gender,
        activityLevel,
        waist: waist ? Number(waist) : undefined,
        hip: hip ? Number(hip) : undefined,
        neck: neck ? Number(neck) : undefined,
      });
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
        paddingBottom: Platform.OS === "web" ? 34 + 80 : insets.bottom + 100,
        paddingHorizontal: 16,
      }}
      bottomOffset={20}
    >
      <View style={styles.formHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="calculator" size={28} color="#fff" />
        </View>
        <Text style={styles.formTitle}>Kalkulator Metaboliczny</Text>
        <Text style={styles.formSubtitle}>Wprowadz swoje dane</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Podstawowe dane</Text>
        <InputField label="Wzrost (cm)" value={height} onChange={setHeight} error={errors.height} icon="resize-outline" />
        <InputField label="Waga (kg)" value={weight} onChange={setWeight} error={errors.weight} icon="scale-outline" />
        <InputField label="Wiek (lata)" value={age} onChange={setAge} error={errors.age} icon="calendar-outline" />

        <Text style={styles.fieldLabel}>Plec</Text>
        <View style={styles.genderRow}>
          <Pressable
            style={[styles.genderBtn, gender === "male" && styles.genderBtnActive]}
            onPress={() => setGender("male")}
          >
            <Ionicons name="male" size={20} color={gender === "male" ? "#fff" : Colors.light.textSecondary} />
            <Text style={[styles.genderText, gender === "male" && styles.genderTextActive]}>Mezczyzna</Text>
          </Pressable>
          <Pressable
            style={[styles.genderBtn, gender === "female" && styles.genderBtnActive]}
            onPress={() => setGender("female")}
          >
            <Ionicons name="female" size={20} color={gender === "female" ? "#fff" : Colors.light.textSecondary} />
            <Text style={[styles.genderText, gender === "female" && styles.genderTextActive]}>Kobieta</Text>
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Poziom aktywnosci</Text>
        {activityLevels.map((level) => (
          <Pressable
            key={level.value}
            style={[styles.activityBtn, activityLevel === level.value && styles.activityBtnActive]}
            onPress={() => setActivityLevel(level.value)}
          >
            <View style={styles.activityRow}>
              <View style={[styles.activityDot, activityLevel === level.value && styles.activityDotActive]} />
              <View>
                <Text style={[styles.activityLabel, activityLevel === level.value && styles.activityLabelActive]}>{level.label}</Text>
                <Text style={styles.activityDesc}>{level.description}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={styles.advancedToggleText}>Pomiary zaawansowane (opcjonalne)</Text>
        <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={20} color={Colors.light.textSecondary} />
      </Pressable>

      {showAdvanced && (
        <View style={styles.card}>
          <Text style={styles.advancedInfo}>Dodatkowe pomiary pozwalaja obliczyc WHtR, BAI i % tkanki tluszczowej.</Text>
          <InputField label="Obwod talii (cm)" value={waist} onChange={setWaist} icon="ellipse-outline" />
          <InputField label="Obwod bioder (cm)" value={hip} onChange={setHip} icon="ellipse-outline" />
          <InputField label="Obwod szyi (cm)" value={neck} onChange={setNeck} icon="ellipse-outline" />
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.calculateBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        onPress={handleCalculate}
      >
        <Ionicons name="calculator" size={20} color="#fff" />
        <Text style={styles.calculateBtnText}>Oblicz wskazniki</Text>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

function InputField({ label, value, onChange, error, icon }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; icon: string;
}) {
  return (
    <View style={styles.inputWrapper}>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <Ionicons name={icon as any} size={18} color={Colors.light.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={label}
          placeholderTextColor={Colors.light.textTertiary}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function CalculatorScreen() {
  const { results } = useMetabolic();
  if (results) return <ResultsView />;
  return <CalculatorForm />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  formHeader: { alignItems: "center", marginBottom: 24 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  formTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.text },
  formSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.light.backgroundCard,
    borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.text, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary, marginTop: 12, marginBottom: 8 },
  genderRow: { flexDirection: "row", gap: 10 },
  genderBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundCard,
  },
  genderBtnActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  genderText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  genderTextActive: { color: "#fff" },
  activityBtn: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.light.border,
    marginBottom: 6,
  },
  activityBtnActive: { borderColor: Colors.light.tint, backgroundColor: Colors.light.tintLight },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  activityDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.light.border },
  activityDotActive: { borderColor: Colors.light.tint, backgroundColor: Colors.light.tint },
  activityLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.text },
  activityLabelActive: { color: Colors.light.tintDark },
  activityDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  advancedToggle: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 4, marginBottom: 4,
  },
  advancedToggleText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  advancedInfo: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginBottom: 12 },
  inputWrapper: { marginBottom: 10 },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.light.backgroundSection,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border,
    paddingHorizontal: 12, height: 48,
  },
  inputError: { borderColor: Colors.light.error },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.text },
  errorText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.error, marginTop: 4, marginLeft: 4 },
  calculateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.light.tint,
    paddingVertical: 16, borderRadius: 14, marginTop: 8, marginBottom: 20,
  },
  calculateBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  resultsHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.light.backgroundCard, justifyContent: "center", alignItems: "center" },
  resultsTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text },
  saveBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.light.backgroundCard, justifyContent: "center", alignItems: "center" },
  sectionLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.text, marginTop: 16, marginBottom: 10 },
  metricsGrid: { gap: 8 },
  metricCard: {
    backgroundColor: Colors.light.backgroundCard, borderRadius: 14,
    padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  metricTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metricTitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  metricValue: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.light.text },
  metricUnit: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  metricSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginTop: 2 },
  infoRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  infoChip: {
    flex: 1, backgroundColor: Colors.light.backgroundCard, borderRadius: 12,
    padding: 14, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  infoChipValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text, marginTop: 6 },
  infoChipLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginTop: 2 },
  calorieRow: { flexDirection: "row", gap: 8 },
  calorieCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  calorieLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.text },
  calorieValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text, marginTop: 2 },
  calorieUnit: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  calorieNote: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginTop: 2 },
});
