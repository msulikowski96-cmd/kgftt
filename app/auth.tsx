import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/lib/AuthContext";
import Colors from "@/constants/colors";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username || username.length < 3) newErrors.username = "Min. 3 znaki";
    if (!password || password.length < 6) newErrors.password = "Min. 6 znakow";
    if (!isLogin && password !== confirmPassword) newErrors.confirm = "Hasla nie sa takie same";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = isLogin
      ? await login(username, password)
      : await register(username, password);

    setLoading(false);

    if (!result.success) {
      Alert.alert(isLogin ? "Blad logowania" : "Blad rejestracji", result.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setConfirmPassword("");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 40,
        paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 40,
        paddingHorizontal: 24,
        flexGrow: 1,
        justifyContent: "center",
      }}
      bottomOffset={20}
    >
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Ionicons name="pulse" size={36} color="#fff" />
        </View>
        <Text style={styles.appName}>MetabolicAI Pro</Text>
        <Text style={styles.tagline}>Twoj osobisty kalkulator metaboliczny</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
            onPress={() => { setIsLogin(true); setErrors({}); }}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Logowanie</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
            onPress={() => { setIsLogin(false); setErrors({}); }}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Rejestracja</Text>
          </Pressable>
        </View>

        <View style={styles.inputWrapper}>
          <View style={[styles.inputContainer, errors.username ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nazwa uzytkownika"
              placeholderTextColor={Colors.light.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Haslo"
              placeholderTextColor={Colors.light.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.light.textSecondary} />
            </Pressable>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {!isLogin && (
          <View style={styles.inputWrapper}>
            <View style={[styles.inputContainer, errors.confirm ? styles.inputError : null]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Potwierdz haslo"
                placeholderTextColor={Colors.light.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
            {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name={isLogin ? "log-in-outline" : "person-add-outline"} size={20} color="#fff" />
              <Text style={styles.submitText}>{isLogin ? "Zaloguj sie" : "Zarejestruj sie"}</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={toggleMode} style={styles.switchRow}>
          <Text style={styles.switchText}>
            {isLogin ? "Nie masz konta? " : "Masz juz konto? "}
            <Text style={styles.switchLink}>{isLogin ? "Zarejestruj sie" : "Zaloguj sie"}</Text>
          </Text>
        </Pressable>
      </View>

      <View style={styles.features}>
        {[
          { icon: "calculator", text: "Kalkulatory BMI, BMR, TDEE" },
          { icon: "analytics", text: "Historia pomiarow z wykresami" },
          { icon: "restaurant", text: "Planer posilkow i makro" },
          { icon: "bulb", text: "Spersonalizowane rekomendacje" },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name={f.icon as any} size={18} color={Colors.light.tint} />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  logoSection: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.light.tint,
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.light.text },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.light.backgroundCard,
    borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 20, backgroundColor: Colors.light.backgroundSection, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: Colors.light.tint },
  tabText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  tabTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  inputWrapper: { marginBottom: 14 },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.light.backgroundSection,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.light.border,
    paddingHorizontal: 14, height: 52,
  },
  inputError: { borderColor: Colors.light.error },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.light.text },
  errorText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.error, marginTop: 4, marginLeft: 4 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.light.tint,
    paddingVertical: 16, borderRadius: 14, marginTop: 4,
  },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  switchRow: { alignItems: "center", marginTop: 16 },
  switchText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  switchLink: { color: Colors.light.tint, fontFamily: "Inter_600SemiBold" },
  features: { paddingHorizontal: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
});
