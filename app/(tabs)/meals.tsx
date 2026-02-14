import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMetabolic } from "@/lib/MetabolicContext";
import { foodDatabase } from "@/lib/useMacroPlanner";
import Colors from "@/constants/colors";

function MacroBar({ label, current, target, unit, color }: {
  label: string; current: number; target: number; unit: string; color: string;
}) {
  const progress = Math.min(current / (target || 1), 1);
  const pct = Math.round(progress * 100);
  return (
    <View style={barStyles.container}>
      <View style={barStyles.header}>
        <Text style={barStyles.label}>{label}</Text>
        <Text style={barStyles.values}>{Math.round(current)}/{target} {unit}</Text>
      </View>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.pct, { color }]}>{pct}%</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.text },
  values: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  track: { height: 8, borderRadius: 4, backgroundColor: Colors.light.borderLight, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  pct: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "right", marginTop: 2 },
});

export default function MealsScreen() {
  const { meals, macroTargets, getDailyTotals, getMacroPercentages, generateMealPlan, addFoodToMeal, removeFoodFromMeal } = useMetabolic();
  const insets = useSafeAreaInsets();
  const [tdee, setTdee] = useState("2000");
  const [goal, setGoal] = useState<"maintain" | "lose" | "gain">("maintain");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("");
  const [selectedFood, setSelectedFood] = useState("");
  const [foodAmount, setFoodAmount] = useState("100");

  const dailyTotals = getDailyTotals();
  const macroPercentages = getMacroPercentages();

  const handleGenerate = () => {
    generateMealPlan(Number(tdee), goal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAddFood = () => {
    if (selectedMeal && selectedFood && foodAmount) {
      addFoodToMeal(selectedMeal, { name: selectedFood, amount: Number(foodAmount), unit: "g" });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setModalVisible(false);
      setSelectedFood("");
      setFoodAmount("100");
    }
  };

  const goals = [
    { value: "lose" as const, label: "Redukcja" },
    { value: "maintain" as const, label: "Utrzymanie" },
    { value: "gain" as const, label: "Wzrost" },
  ];

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
        <Text style={styles.screenTitle}>Planer posilkow</Text>
        <Text style={styles.screenSubtitle}>Sledz swoje makroskladniki</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cele kaloryczne</Text>
          <View style={styles.tdeeRow}>
            <View style={styles.tdeeInputWrap}>
              <Ionicons name="flame-outline" size={18} color={Colors.light.textSecondary} />
              <TextInput
                style={styles.tdeeInput}
                value={tdee}
                onChangeText={setTdee}
                keyboardType="numeric"
                placeholder="TDEE (kcal)"
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
          </View>
          <View style={styles.goalRow}>
            {goals.map(g => (
              <Pressable
                key={g.value}
                style={[styles.goalBtn, goal === g.value && styles.goalBtnActive]}
                onPress={() => setGoal(g.value)}
              >
                <Text style={[styles.goalText, goal === g.value && styles.goalTextActive]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.genBtn, pressed && { opacity: 0.85 }]}
            onPress={handleGenerate}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.genBtnText}>Generuj plan</Text>
          </Pressable>
        </View>

        <View style={styles.targetsRow}>
          <View style={styles.targetChip}>
            <Text style={styles.targetValue}>{macroTargets.calories}</Text>
            <Text style={styles.targetLabel}>kcal</Text>
          </View>
          <View style={styles.targetChip}>
            <Text style={[styles.targetValue, { color: Colors.light.protein }]}>{macroTargets.protein}g</Text>
            <Text style={styles.targetLabel}>bialko</Text>
          </View>
          <View style={styles.targetChip}>
            <Text style={[styles.targetValue, { color: Colors.light.carbs }]}>{macroTargets.carbs}g</Text>
            <Text style={styles.targetLabel}>wegle</Text>
          </View>
          <View style={styles.targetChip}>
            <Text style={[styles.targetValue, { color: Colors.light.fat }]}>{macroTargets.fat}g</Text>
            <Text style={styles.targetLabel}>tluszcze</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dzisiejsze podsumowanie</Text>
          <MacroBar label="Kalorie" current={dailyTotals.calories} target={macroTargets.calories} unit="kcal" color={Colors.light.calories} />
          <MacroBar label="Bialko" current={dailyTotals.protein} target={macroTargets.protein} unit="g" color={Colors.light.protein} />
          <MacroBar label="Weglowodany" current={dailyTotals.carbs} target={macroTargets.carbs} unit="g" color={Colors.light.carbs} />
          <MacroBar label="Tluszcze" current={dailyTotals.fat} target={macroTargets.fat} unit="g" color={Colors.light.fat} />
        </View>

        <View style={styles.distRow}>
          <View style={[styles.distChip, { backgroundColor: Colors.light.protein }]}>
            <Text style={styles.distValue}>{macroPercentages.protein}%</Text>
            <Text style={styles.distLabel}>Bialko</Text>
          </View>
          <View style={[styles.distChip, { backgroundColor: Colors.light.carbs }]}>
            <Text style={styles.distValue}>{macroPercentages.carbs}%</Text>
            <Text style={styles.distLabel}>Wegle</Text>
          </View>
          <View style={[styles.distChip, { backgroundColor: Colors.light.fat }]}>
            <Text style={styles.distValue}>{macroPercentages.fat}%</Text>
            <Text style={styles.distLabel}>Tluszcze</Text>
          </View>
        </View>

        {meals.length > 0 && (
          <>
            <Text style={styles.mealsTitle}>Posilki</Text>
            {meals.map(meal => (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                  <Pressable onPress={() => { setSelectedMeal(meal.id); setModalVisible(true); }} hitSlop={8}>
                    <Ionicons name="add-circle-outline" size={24} color={Colors.light.tint} />
                  </Pressable>
                </View>
                <View style={styles.mealMacros}>
                  <Text style={styles.mealMacro}>{meal.calories} kcal</Text>
                  <Text style={styles.mealMacro}>B: {meal.protein}g</Text>
                  <Text style={styles.mealMacro}>W: {meal.carbs}g</Text>
                  <Text style={styles.mealMacro}>T: {meal.fat}g</Text>
                </View>
                {meal.foods.length > 0 && (
                  <View style={styles.foodsList}>
                    {meal.foods.map((food, idx) => (
                      <View key={idx} style={styles.foodRow}>
                        <Text style={styles.foodName}>
                          {foodDatabase.find(f => f.name === food.name)?.label || food.name}
                        </Text>
                        <View style={styles.foodRight}>
                          <Text style={styles.foodAmount}>{food.amount}g</Text>
                          <Pressable onPress={() => { removeFoodFromMeal(meal.id, idx); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color={Colors.light.error} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Dodaj produkt</Text>
            <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
              {foodDatabase.map(food => (
                <Pressable
                  key={food.name}
                  style={[styles.foodOption, selectedFood === food.name && styles.foodOptionActive]}
                  onPress={() => setSelectedFood(food.name)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodOptionName}>{food.label}</Text>
                    <Text style={styles.foodOptionInfo}>
                      {food.calories} kcal | B: {food.protein}g W: {food.carbs}g T: {food.fat}g
                    </Text>
                  </View>
                  {selectedFood === food.name && <Ionicons name="checkmark-circle" size={22} color={Colors.light.tint} />}
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.amountRow}>
              <Ionicons name="scale-outline" size={18} color={Colors.light.textSecondary} />
              <TextInput
                style={styles.amountInput}
                value={foodAmount}
                onChangeText={setFoodAmount}
                keyboardType="numeric"
                placeholder="Ilosc (g)"
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
            <View style={styles.modalBtnRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </Pressable>
              <Pressable
                style={[styles.addBtn, !selectedFood && { opacity: 0.5 }]}
                onPress={handleAddFood}
                disabled={!selectedFood}
              >
                <Text style={styles.addBtnText}>Dodaj</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.text },
  screenSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 2, marginBottom: 16 },
  card: {
    backgroundColor: Colors.light.backgroundCard, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text, marginBottom: 12 },
  tdeeRow: { marginBottom: 10 },
  tdeeInputWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.light.backgroundSection, borderRadius: 12,
    paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: Colors.light.border,
  },
  tdeeInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.text },
  goalRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  goalBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.light.border, alignItems: "center",
    backgroundColor: Colors.light.backgroundCard,
  },
  goalBtnActive: { backgroundColor: Colors.light.tintLight, borderColor: Colors.light.tint },
  goalText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.text },
  goalTextActive: { color: Colors.light.tintDark },
  genBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.light.tint, paddingVertical: 12, borderRadius: 12,
  },
  genBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  targetsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  targetChip: {
    flex: 1, alignItems: "center", paddingVertical: 12,
    backgroundColor: Colors.light.backgroundCard, borderRadius: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  targetValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  targetLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginTop: 2 },
  distRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  distChip: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  distValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  distLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  mealsTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text, marginBottom: 10 },
  mealCard: {
    backgroundColor: Colors.light.backgroundCard, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  mealName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  mealTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginTop: 2 },
  mealMacros: { flexDirection: "row", gap: 12, marginBottom: 8 },
  mealMacro: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  foodsList: { borderTopWidth: 1, borderTopColor: Colors.light.borderLight, paddingTop: 8 },
  foodRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  foodName: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.text, flex: 1 },
  foodRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  foodAmount: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: Colors.light.backgroundCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: "80%",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.light.border, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text, marginBottom: 12 },
  foodList: { maxHeight: 300 },
  foodOption: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 12, borderRadius: 10, marginBottom: 6,
    backgroundColor: Colors.light.backgroundSection,
  },
  foodOptionActive: { backgroundColor: Colors.light.tintLight },
  foodOptionName: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.text },
  foodOptionInfo: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginTop: 2 },
  amountRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.light.backgroundSection, borderRadius: 12,
    paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: Colors.light.border,
    marginTop: 12,
  },
  amountInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.text },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.border, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  addBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.light.tint, alignItems: "center" },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
