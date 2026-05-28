import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProgressChart } from '@/components/progress-chart';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWorkout } from '@/context/workout-context';
import type { CompletedWorkout } from '@/types/workout';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatShortTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function workoutDuration(startedAt: string, completedAt: string): number {
  return Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000);
}

function WorkoutHistoryCard({ item }: { item: CompletedWorkout }) {
  const doneSets = item.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const totalSets = item.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalLiftTime = item.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.duration, 0),
    0,
  );
  const totalWorkoutTime = workoutDuration(item.startedAt, item.date);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Workout {item.type}
        </ThemedText>
        <View
          style={[
            styles.badge,
            item.failed ? styles.badgeFail : styles.badgeSuccess,
          ]}
        >
          <ThemedText style={styles.badgeText}>
            {item.failed ? 'FAILED' : 'DONE'}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.cardDate}>{formatDate(item.date)}</ThemedText>
      <ThemedText style={styles.cardStats}>
        Duration: {formatTime(totalWorkoutTime)} · Lift time: {formatTime(totalLiftTime)} · {doneSets}/{totalSets} sets
      </ThemedText>
      {item.exercises.map((ex) => {
        const done = ex.sets.filter((s) => s.completed).length;
        const exerciseTime = ex.sets.reduce((sum, s) => sum + s.duration, 0);
        return (
          <View key={ex.name} style={styles.exerciseRow}>
            <View
              style={[
                styles.setDot,
                done === ex.sets.length ? styles.setDotDone : styles.setDotFail,
              ]}
            />
            <ThemedText style={styles.exerciseLine}>
              {ex.name}: {ex.weight} lbs × {ex.targetReps}
            </ThemedText>
            <ThemedText style={styles.exerciseRight}>
              {done}/{ex.sets.length} · {formatShortTime(exerciseTime)}
            </ThemedText>
          </View>
        );
      })}
    </ThemedView>
  );
}

function PRSection() {
  const { state } = useWorkout();
  const prs = useMemo(() => {
    const records: Record<string, { weight: number; date: string }> = {};
    for (const workout of state.history) {
      for (const ex of workout.exercises) {
        const allCompleted = ex.sets.every((s) => s.completed);
        if (!allCompleted) continue;
        const prev = records[ex.name];
        if (!prev || ex.weight > prev.weight) {
          records[ex.name] = { weight: ex.weight, date: workout.date };
        }
      }
    }
    return records;
  }, [state.history]);

  const names = Object.keys(prs);
  if (names.length === 0) return null;

  return (
    <ThemedView type="backgroundElement" style={styles.prSection}>
      <ThemedText type="subtitle" style={styles.prSectionTitle}>
        Personal Records
      </ThemedText>
      {names.map((name) => (
        <View key={name} style={styles.prRow}>
          <ThemedText style={styles.prName}>{name}</ThemedText>
          <ThemedText style={styles.prValue}>{prs[name].weight} lbs</ThemedText>
          <ThemedText style={styles.prDate}>{formatDate(prs[name].date)}</ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

function ChartSection() {
  const { state } = useWorkout();
  const charts = useMemo(() => {
    const sorted = [...state.history].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );
    const exerciseData: Record<string, { label: string; weight: number }[]> = {};
    for (const w of sorted) {
      for (const ex of w.exercises) {
        if (!exerciseData[ex.name]) exerciseData[ex.name] = [];
        exerciseData[ex.name].push({ label: shortDate(w.date), weight: ex.weight });
      }
    }
    return exerciseData;
  }, [state.history]);

  const names = Object.keys(charts);
  if (names.length === 0) return null;

  return (
    <ThemedView type="backgroundElement" style={styles.chartSection}>
      <ThemedText type="subtitle" style={styles.chartSectionTitle}>
        Progress
      </ThemedText>
      {names.map((name) => (
        <ProgressChart key={name} title={name} data={charts[name]} />
      ))}
    </ThemedView>
  );
}

export default function HistoryScreen() {
  const { state } = useWorkout();
  const history = [...state.history].reverse();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.pageTitle}>
          History
        </ThemedText>
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No workouts yet. Start your first workout!
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => <WorkoutHistoryCard item={item} />}
            ListHeaderComponent={<View style={styles.listHeader}><PRSection /><ChartSection /></View>}
            contentContainerStyle={styles.listContent}
          />
        )}
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
  pageTitle: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 20 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeSuccess: { backgroundColor: '#2ecc7133' },
  badgeFail: { backgroundColor: '#e74c3c33' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardDate: { fontSize: 14, opacity: 0.7 },
  cardStats: { fontSize: 13, opacity: 0.6, marginBottom: Spacing.one },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 3,
  },
  exerciseLine: { fontSize: 14, fontWeight: '600', flex: 1 },
  exerciseRight: { fontSize: 13, fontVariant: ['tabular-nums'], opacity: 0.7 },
  setDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  setDotDone: { backgroundColor: '#2ecc71' },
  setDotFail: { backgroundColor: '#e74c3c' },
  listHeader: { gap: Spacing.three },
  prSection: {
    borderRadius: 12,
    padding: Spacing.three,
  },
  prSectionTitle: { fontSize: 20, marginBottom: Spacing.two },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  prName: { fontSize: 15, fontWeight: '600', flex: 1 },
  prValue: { fontSize: 16, fontWeight: '800', marginRight: Spacing.two },
  prDate: { fontSize: 13, opacity: 0.6, fontVariant: ['tabular-nums'] },
  chartSection: {
    borderRadius: 12,
    padding: Spacing.three,
  },
  chartSectionTitle: { fontSize: 20, marginBottom: Spacing.two },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  emptyText: { fontSize: 16, opacity: 0.6, textAlign: 'center' },
});
