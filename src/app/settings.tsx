import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWorkout } from '@/context/workout-context';
import { useColorSchemeContext } from '@/context/color-scheme-context';
import { ALL_EXERCISES } from '@/types/workout';

function NumInput({
  value,
  onChange,
  suffix,
  theme,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.inputRow}>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundSelected,
          },
        ]}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholderTextColor={theme.textSecondary}
      />
      <ThemedText style={styles.suffix}>{suffix}</ThemedText>
    </View>
  );
}

interface ExerciseFormData {
  startingWeight: string;
  increment: string;
  deloadAmount: string;
}

export default function SettingsScreen() {
  const { state, updateSettings, updateProgression, resetAll } = useWorkout();
  const { colorScheme, toggleColorScheme } = useColorSchemeContext();
  const theme = useTheme();

  const [defaults, setDefaults] = useState({
    startingWeight: String(state.settings.startingWeight),
    increment: String(state.settings.increment),
    deloadAmount: String(state.settings.deloadAmount),
  });

  const [exercises, setExercises] = useState<Record<string, ExerciseFormData>>(() => {
    const map: Record<string, ExerciseFormData> = {};
    for (const name of ALL_EXERCISES) {
      const p = state.progression[name];
      map[name] = {
        startingWeight: String(p?.startingWeight ?? state.settings.startingWeight),
        increment: String(p?.increment ?? state.settings.increment),
        deloadAmount: String(p?.deloadAmount ?? state.settings.deloadAmount),
      };
    }
    return map;
  });

  const parseNum = (v: string) => {
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  };

  const handleSaveAll = () => {
    const sw = parseNum(defaults.startingWeight);
    const inc = parseNum(defaults.increment);
    const dl = parseNum(defaults.deloadAmount);
    if (sw < 0 || inc < 1 || dl < 1) {
      Alert.alert('Invalid input', 'Starting weight must be 0+, increment and deload must be 1+.');
      return;
    }
    updateSettings({ startingWeight: sw, increment: inc, deloadAmount: dl });

    for (const name of ALL_EXERCISES) {
      const e = exercises[name];
      const eSw = parseNum(e.startingWeight);
      const eInc = parseNum(e.increment);
      const eDl = parseNum(e.deloadAmount);
      updateProgression(name, {
        startingWeight: eSw,
        increment: eInc,
        deloadAmount: eDl,
        currentWeight: eSw,
      });
    }

    Alert.alert('Saved', 'Settings updated for all exercises.');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will erase all workout history and reset progression. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetAll(),
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.pageTitle}>
            Settings
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Appearance
            </ThemedText>
            <Pressable
              onPress={toggleColorScheme}
              style={({ pressed }) => [styles.themeRow, pressed && styles.pressed]}
            >
              <ThemedText style={styles.themeLabel}>
                Theme
              </ThemedText>
              <View style={styles.themeToggle}>
                <ThemedText style={styles.themeValue}>
                  {colorScheme === 'dark' ? 'Dark' : 'Light'}
                </ThemedText>
              </View>
            </Pressable>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Global Defaults
            </ThemedText>
            <ThemedText style={styles.hint}>
              These apply to any exercise without specific settings below.
            </ThemedText>
            <View style={styles.defaultsGrid}>
              <ThemedText style={styles.defaultsLabel}>Starting Wt</ThemedText>
              <NumInput
                value={defaults.startingWeight}
                onChange={(v) => setDefaults((d) => ({ ...d, startingWeight: v }))}
                suffix="lbs"
                theme={theme}
              />
              <ThemedText style={styles.defaultsLabel}>Increment</ThemedText>
              <NumInput
                value={defaults.increment}
                onChange={(v) => setDefaults((d) => ({ ...d, increment: v }))}
                suffix="lbs"
                theme={theme}
              />
              <ThemedText style={styles.defaultsLabel}>Deload</ThemedText>
              <NumInput
                value={defaults.deloadAmount}
                onChange={(v) => setDefaults((d) => ({ ...d, deloadAmount: v }))}
                suffix="lbs"
                theme={theme}
              />
            </View>
          </ThemedView>

          {ALL_EXERCISES.map((name) => {
            const e = exercises[name];
            if (!e) return null;
            return (
              <ThemedView key={name} type="backgroundElement" style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  {name}
                </ThemedText>
                <View style={styles.defaultsGrid}>
                  <ThemedText style={styles.defaultsLabel}>Starting Wt</ThemedText>
                  <NumInput
                    value={e.startingWeight}
                    onChange={(v) =>
                      setExercises((prev) => ({
                        ...prev,
                        [name]: { ...prev[name], startingWeight: v },
                      }))
                    }
                    suffix="lbs"
                    theme={theme}
                  />
                  <ThemedText style={styles.defaultsLabel}>Increment</ThemedText>
                  <NumInput
                    value={e.increment}
                    onChange={(v) =>
                      setExercises((prev) => ({
                        ...prev,
                        [name]: { ...prev[name], increment: v },
                      }))
                    }
                    suffix="lbs"
                    theme={theme}
                  />
                  <ThemedText style={styles.defaultsLabel}>Deload</ThemedText>
                  <NumInput
                    value={e.deloadAmount}
                    onChange={(v) =>
                      setExercises((prev) => ({
                        ...prev,
                        [name]: { ...prev[name], deloadAmount: v },
                      }))
                    }
                    suffix="lbs"
                    theme={theme}
                  />
                </View>
                {state.progression[name] && (
                  <ThemedText style={styles.currentWt}>
                    Current: {state.progression[name].currentWeight} lbs
                  </ThemedText>
                )}
              </ThemedView>
            );
          })}

          <Pressable
            onPress={handleSaveAll}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            <ThemedText style={styles.saveButtonText}>Save All Settings</ThemedText>
          </Pressable>

          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <ThemedText style={styles.resetButtonText}>Reset All Data</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  scrollContent: { padding: Spacing.three, gap: Spacing.four },
  pageTitle: { textAlign: 'center', paddingVertical: Spacing.two },
  section: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionTitle: { fontSize: 20, marginBottom: Spacing.one },
  hint: { fontSize: 13, opacity: 0.6, marginBottom: Spacing.one },
  defaultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  defaultsLabel: { fontSize: 14, fontWeight: '600', width: 80 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 15,
    width: 64,
    textAlign: 'center',
  },
  suffix: { fontSize: 14, opacity: 0.6, width: 28 },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  themeLabel: { fontSize: 16, fontWeight: '600' },
  themeToggle: {
    backgroundColor: '#3c87f7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  themeValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
  currentWt: { fontSize: 13, opacity: 0.7, marginTop: Spacing.one },
  saveButton: {
    backgroundColor: '#3c87f7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resetButton: {
    borderWidth: 1,
    borderColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: { color: '#e74c3c', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
