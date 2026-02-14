import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMetabolic } from "@/lib/MetabolicContext";
import type { Recommendation } from "@/lib/types";
import Colors from "@/constants/colors";

const categoryLabels: Record<string, string> = {
  nutrition: "Zywienie",
  exercise: "Aktywnosc",
  hydration: "Nawodnienie",
  sleep: "Sen",
  general: "Ogolne",
};

const categoryIcons: Record<string, string> = {
  nutrition: "nutrition-outline",
  exercise: "fitness-outline",
  hydration: "water-outline",
  sleep: "moon-outline",
  general: "information-circle-outline",
};

const categoryOrder = ["nutrition", "exercise", "hydration", "sleep", "general"];

const iconMap: Record<string, string> = {
  "nutrition": "nutrition-outline",
  "fitness-center": "barbell-outline",
  "checkmark-circle": "checkmark-circle-outline",
  "body": "body-outline",
  "resize": "resize-outline",
  "walk": "walk-outline",
  "water": "water-outline",
  "moon": "moon-outline",
  "restaurant": "restaurant-outline",
};

function RecommendationCardItem({ rec }: { rec: Recommendation }) {
  const icon = iconMap[rec.icon] || "information-circle-outline";
  return (
    <View style={[recStyles.card, { borderLeftColor: rec.accentColor }]}>
      <View style={[recStyles.iconWrap, { backgroundColor: rec.accentColor + "18" }]}>
        <Ionicons name={icon as any} size={22} color={rec.accentColor} />
      </View>
      <View style={recStyles.textWrap}>
        <View style={recStyles.titleRow}>
          <Text style={recStyles.title}>{rec.title}</Text>
          <View style={[recStyles.catBadge, { backgroundColor: rec.accentColor + "12" }]}>
            <Text style={[recStyles.catText, { color: rec.accentColor }]}>{categoryLabels[rec.category]}</Text>
          </View>
        </View>
        <Text style={recStyles.desc}>{rec.description}</Text>
      </View>
    </View>
  );
}

const recStyles = StyleSheet.create({
  card: {
    flexDirection: "row", backgroundColor: Colors.light.backgroundCard,
    borderRadius: 14, borderLeftWidth: 4, padding: 14, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  textWrap: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text, flex: 1 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  catText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  desc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, lineHeight: 18 },
});

const quickTips = [
  "Jedz regularnie, co 3-4 godziny",
  "Spozywaj 25-35g blonnika dziennie",
  "Unikaj napojow slodzonych",
  "Planuj posilki z wyprzedzeniem",
  "Monitoruj postepy regularnie",
];

export default function TipsScreen() {
  const { recommendations } = useMetabolic();
  const insets = useSafeAreaInsets();

  const groupedRecs = recommendations.reduce((acc, rec) => {
    if (!acc[rec.category]) acc[rec.category] = [];
    acc[rec.category].push(rec);
    return acc;
  }, {} as Record<string, Recommendation[]>);

  const hasRecs = recommendations.length > 0;

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
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="bulb" size={28} color="#F59E0B" />
          </View>
          <Text style={styles.screenTitle}>Rekomendacje</Text>
          <Text style={styles.screenSubtitle}>
            {hasRecs ? "Spersonalizowane wskazowki dla Ciebie" : "Wykonaj obliczenia, aby zobaczyc porady"}
          </Text>
        </View>

        {!hasRecs && (
          <View style={styles.emptyCard}>
            <Ionicons name="calculator-outline" size={40} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>Brak rekomendacji</Text>
            <Text style={styles.emptyText}>Wypelnij dane w kalkulatorze, aby otrzymac spersonalizowane porady</Text>
          </View>
        )}

        {hasRecs && categoryOrder.map(category => {
          const recs = groupedRecs[category];
          if (!recs || recs.length === 0) return null;
          return (
            <View key={category} style={styles.catSection}>
              <View style={styles.catHeader}>
                <Ionicons name={(categoryIcons[category] || "information-circle-outline") as any} size={18} color={Colors.light.textSecondary} />
                <Text style={styles.catTitle}>{categoryLabels[category]}</Text>
                <View style={styles.catCount}>
                  <Text style={styles.catCountText}>{recs.length}</Text>
                </View>
              </View>
              {recs.map((rec, idx) => <RecommendationCardItem key={idx} rec={rec} />)}
            </View>
          );
        })}

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={styles.tipsTitle}>Szybkie wskazowki</Text>
          </View>
          {quickTips.map((tip, idx) => (
            <View key={idx} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.light.tint} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { alignItems: "center", marginBottom: 20 },
  headerIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.text },
  screenSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 4 },
  emptyCard: {
    backgroundColor: Colors.light.backgroundCard, borderRadius: 16, padding: 32,
    alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.text, marginTop: 12 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textTertiary, textAlign: "center", marginTop: 4 },
  catSection: { marginBottom: 16 },
  catHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  catTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  catCount: { backgroundColor: Colors.light.backgroundSection, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  catCountText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  tipsCard: {
    backgroundColor: "#FFFBEB", borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: "#FCD34D",
  },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  tipsTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#92400E" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#78350F" },
});
