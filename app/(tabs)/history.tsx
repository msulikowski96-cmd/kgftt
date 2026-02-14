import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMetabolic } from "@/lib/MetabolicContext";
import type { Measurement } from "@/lib/types";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function SimpleLineChart({ measurements, metric }: { measurements: Measurement[]; metric: "weight" | "bmi" | "bodyFat" }) {
  const sorted = [...measurements].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-10);
  const data = sorted.map(m => {
    if (metric === "weight") return m.weight;
    if (metric === "bmi") return m.bmi;
    return m.bodyFat || 0;
  });

  if (data.length < 2) {
    return (
      <View style={chartStyles.empty}>
        <Ionicons name="analytics-outline" size={32} color={Colors.light.textTertiary} />
        <Text style={chartStyles.emptyText}>Za malo danych do wyswietlenia wykresu</Text>
      </View>
    );
  }

  const metricColors: Record<string, string> = { weight: Colors.light.tint, bmi: Colors.light.info, bodyFat: Colors.light.warning };
  const metricLabels: Record<string, string> = { weight: "Waga (kg)", bmi: "BMI", bodyFat: "% Tluszczu" };
  const color = metricColors[metric];
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const chartW = SCREEN_WIDTH - 80;
  const chartH = 140;

  return (
    <View style={chartStyles.container}>
      <Text style={[chartStyles.title, { color }]}>{metricLabels[metric]}</Text>
      <View style={chartStyles.chartArea}>
        <View style={chartStyles.yAxis}>
          <Text style={chartStyles.yLabel}>{maxVal.toFixed(1)}</Text>
          <Text style={chartStyles.yLabel}>{((maxVal + minVal) / 2).toFixed(1)}</Text>
          <Text style={chartStyles.yLabel}>{minVal.toFixed(1)}</Text>
        </View>
        <View style={{ width: chartW, height: chartH }}>
          {[0, 0.5, 1].map((r, i) => (
            <View key={i} style={[chartStyles.gridLine, { top: r * chartH }]} />
          ))}
          {data.map((val, i) => {
            const x = (i / (data.length - 1)) * (chartW - 16) + 8;
            const y = chartH - ((val - minVal) / range) * (chartH - 20) - 10;
            return (
              <View key={i} style={[chartStyles.dot, { left: x - 5, top: y - 5, backgroundColor: color }]}>
                {(i === 0 || i === data.length - 1) && (
                  <Text style={[chartStyles.dotLabel, { color }]}>{val.toFixed(1)}</Text>
                )}
              </View>
            );
          })}
          {data.slice(0, -1).map((val, i) => {
            const x1 = (i / (data.length - 1)) * (chartW - 16) + 8;
            const y1 = chartH - ((val - minVal) / range) * (chartH - 20) - 10;
            const x2 = ((i + 1) / (data.length - 1)) * (chartW - 16) + 8;
            const y2 = chartH - ((data[i + 1] - minVal) / range) * (chartH - 20) - 10;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View key={`line-${i}`}
                style={[chartStyles.line, {
                  left: x1, top: y1,
                  width: len, backgroundColor: color,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: "left center" as any,
                }]}
              />
            );
          })}
        </View>
      </View>
      <View style={chartStyles.xAxis}>
        {sorted.map((m, i) => {
          if (sorted.length > 5 && i % 2 !== 0 && i !== sorted.length - 1) return null;
          return (
            <Text key={i} style={chartStyles.xLabel}>
              {m.date.getDate()}.{(m.date.getMonth() + 1).toString().padStart(2, "0")}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { backgroundColor: Colors.light.backgroundCard, borderRadius: 16, padding: 16, marginBottom: 12 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  chartArea: { flexDirection: "row" },
  yAxis: { width: 40, justifyContent: "space-between", paddingVertical: 5 },
  yLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, textAlign: "right" },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: Colors.light.borderLight },
  dot: { position: "absolute", width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: "#fff" },
  dotLabel: { position: "absolute", top: -16, left: -8, fontSize: 10, fontFamily: "Inter_600SemiBold", width: 30, textAlign: "center" },
  line: { position: "absolute", height: 2, borderRadius: 1, opacity: 0.6 },
  xAxis: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingLeft: 40 },
  xLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary },
  empty: { backgroundColor: Colors.light.backgroundCard, borderRadius: 16, padding: 32, alignItems: "center", marginBottom: 12 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginTop: 8 },
});

export default function HistoryScreen() {
  const { measurements, deleteMeasurement, clearHistory } = useMetabolic();
  const insets = useSafeAreaInsets();
  const [selectedMetric, setSelectedMetric] = useState<"weight" | "bmi" | "bodyFat">("weight");

  const handleClear = () => {
    Alert.alert("Wyczysc historie", "Czy na pewno chcesz usunac wszystkie pomiary?", [
      { text: "Anuluj", style: "cancel" },
      { text: "Usun", style: "destructive", onPress: () => { clearHistory(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } }
    ]);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Usun pomiar", "Czy na pewno chcesz usunac ten pomiar?", [
      { text: "Anuluj", style: "cancel" },
      { text: "Usun", style: "destructive", onPress: () => { deleteMeasurement(id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }
    ]);
  };

  if (measurements.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="analytics-outline" size={56} color={Colors.light.textTertiary} />
        <Text style={styles.emptyTitle}>Brak pomiarow</Text>
        <Text style={styles.emptyText}>Twoje pomiary pojawia sie tutaj po zapisaniu</Text>
      </View>
    );
  }

  const latest = measurements[0];
  const oldest = measurements[measurements.length - 1];
  const weightChange = Math.round((latest.weight - oldest.weight) * 10) / 10;
  const bmiChange = Math.round((latest.bmi - oldest.bmi) * 10) / 10;

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
        <Text style={styles.screenTitle}>Historia pomiarow</Text>
        <Text style={styles.screenSubtitle}>{measurements.length} pomiarow</Text>

        <View style={styles.progressRow}>
          <View style={[styles.progressCard, weightChange <= 0 ? styles.progressGreen : styles.progressRed]}>
            <Ionicons name={weightChange < 0 ? "trending-down" : weightChange > 0 ? "trending-up" : "remove"} size={22} color="#fff" />
            <Text style={styles.progressValue}>{weightChange > 0 ? "+" : ""}{weightChange} kg</Text>
            <Text style={styles.progressLabel}>Zmiana wagi</Text>
          </View>
          <View style={[styles.progressCard, bmiChange <= 0 ? styles.progressGreen : styles.progressRed]}>
            <Ionicons name={bmiChange < 0 ? "trending-down" : bmiChange > 0 ? "trending-up" : "remove"} size={22} color="#fff" />
            <Text style={styles.progressValue}>{bmiChange > 0 ? "+" : ""}{bmiChange}</Text>
            <Text style={styles.progressLabel}>Zmiana BMI</Text>
          </View>
        </View>

        <SimpleLineChart measurements={measurements} metric={selectedMetric} />

        <View style={styles.metricSelector}>
          {(["weight", "bmi", "bodyFat"] as const).map(m => {
            const labels = { weight: "Waga", bmi: "BMI", bodyFat: "% Tluszczu" };
            const disabled = m === "bodyFat" && !measurements.some(x => x.bodyFat);
            return (
              <Pressable
                key={m}
                style={[styles.metricBtn, selectedMetric === m && styles.metricBtnActive, disabled && styles.metricBtnDisabled]}
                onPress={() => !disabled && setSelectedMetric(m)}
                disabled={disabled}
              >
                <Text style={[styles.metricBtnText, selectedMetric === m && styles.metricBtnTextActive, disabled && styles.metricBtnTextDisabled]}>
                  {labels[m]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.listTitle}>Ostatnie pomiary</Text>
        {measurements.slice(0, 15).map((m) => (
          <View key={m.id} style={styles.measurementCard}>
            <View style={styles.measurementLeft}>
              <Text style={styles.measurementDate}>
                {m.date.getDate()}.{(m.date.getMonth() + 1).toString().padStart(2, "0")}.{m.date.getFullYear()}
              </Text>
              <View style={styles.measurementValues}>
                <Text style={styles.measurementWeight}>{m.weight} kg</Text>
                <Text style={styles.measurementBmi}>BMI: {m.bmi}</Text>
                {m.bodyFat !== undefined && <Text style={styles.measurementFat}>{m.bodyFat}%</Text>}
              </View>
            </View>
            <Pressable onPress={() => handleDelete(m.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={Colors.light.error} />
            </Pressable>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
          onPress={handleClear}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.light.error} />
          <Text style={styles.clearBtnText}>Wyczysc historie</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.text },
  screenSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 2, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.light.text, marginTop: 16 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginTop: 4 },
  progressRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  progressCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: "center" },
  progressGreen: { backgroundColor: Colors.light.tint },
  progressRed: { backgroundColor: Colors.light.error },
  progressValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 6 },
  progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  metricSelector: { flexDirection: "row", gap: 8, marginBottom: 16 },
  metricBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.light.backgroundCard, borderWidth: 1, borderColor: Colors.light.border,
    alignItems: "center",
  },
  metricBtnActive: { backgroundColor: Colors.light.tintLight, borderColor: Colors.light.tint },
  metricBtnDisabled: { opacity: 0.4 },
  metricBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.text },
  metricBtnTextActive: { color: Colors.light.tintDark },
  metricBtnTextDisabled: { color: Colors.light.textTertiary },
  listTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text, marginBottom: 10 },
  measurementCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.light.backgroundCard, borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  measurementLeft: { flex: 1 },
  measurementDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, marginBottom: 4 },
  measurementValues: { flexDirection: "row", gap: 12 },
  measurementWeight: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  measurementBmi: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  measurementFat: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  clearBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.light.error,
    marginTop: 8, marginBottom: 20,
  },
  clearBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.error },
});
