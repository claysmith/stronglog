import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWorkout } from '@/context/workout-context';
import { useColorSchemeContext } from '@/context/color-scheme-context';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const RED = '#e74c3c';
const RED_LIGHT = '#e74c3c33';
const RED_MUTED = '#c0392b';

function SetCircle({
  completed,
  inProgress,
  onPress,
}: {
  completed: boolean;
  inProgress: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.setCirclePressable}>
      <View
        style={[
          styles.setCircle,
          completed && styles.setCircleCompleted,
          inProgress && !completed && styles.setCircleInProgress,
        ]}
      >
        <View style={[styles.setCircleInner, completed && styles.setCircleInnerFilled]}>
          <ThemedText style={styles.setCircleText}>
            {completed ? '✓' : ''}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

function SetRow({
  set,
  weight,
  reps,
  onToggle,
}: {
  set: { setNumber: number; completed: boolean; elapsed: number; inProgress: boolean; startedAt: string | null };
  weight: number;
  reps: number;
  onToggle: () => void;
}) {
  const [displayElapsed, setDisplayElapsed] = useState(set.elapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!set.inProgress || set.completed) return;
    const start = set.startedAt ? new Date(set.startedAt).getTime() : Date.now();
    intervalRef.current = setInterval(() => {
      setDisplayElapsed(Math.floor((Date.now() - start) / 1000));
    }, 200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [set.inProgress, set.completed, set.startedAt]);

  const elapsed = set.inProgress ? displayElapsed : set.elapsed;
  const showTime = set.inProgress || set.elapsed > 0;

  return (
    <View style={styles.setRow}>
      <SetCircle
        completed={set.completed}
        inProgress={set.inProgress}
        onPress={onToggle}
      />
      <ThemedText style={styles.setLabel}>
        Set {set.setNumber}
      </ThemedText>
      <ThemedText style={styles.setWeight}>
        {weight} lbs × {reps}
      </ThemedText>
      <ThemedText
        themeColor={set.inProgress ? 'text' : 'textSecondary'}
        style={styles.setTimer}
      >
        {showTime ? formatTime(elapsed) : '--:--'}
      </ThemedText>
    </View>
  );
}

function ExerciseCard({
  exercise,
  index,
  onToggleSet,
}: {
  exercise: { name: string; weight: number; targetReps: number; sets: { setNumber: number; completed: boolean; elapsed: number; inProgress: boolean; startedAt: string | null }[] };
  index: number;
  onToggleSet: (setIndex: number) => void;
}) {
  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;

  return (
    <ThemedView type="backgroundElement" style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <ThemedText type="subtitle" style={styles.exerciseName}>
          {exercise.name}
        </ThemedText>
        <ThemedText style={styles.exerciseWeight}>
          {exercise.weight} lbs
        </ThemedText>
      </View>
      <ThemedText style={styles.exerciseProgress}>
        {completedSets}/{totalSets} sets completed
      </ThemedText>
      {exercise.sets.map((set, si) => (
        <SetRow
          key={si}
          set={set}
          weight={exercise.weight}
          reps={exercise.targetReps}
          onToggle={() => onToggleSet(si)}
        />
      ))}
    </ThemedView>
  );
}

function ActiveWorkoutView() {
  const { state, toggleSet, completeWorkout, failWorkout, cancelWorkout } = useWorkout();
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (!state.activeWorkout) return;
    const start = new Date(state.activeWorkout.startedAt).getTime();
    const interval = setInterval(() => {
      setTotalTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [state.activeWorkout]);

  if (!state.activeWorkout) return null;

  const allComplete = state.activeWorkout.exercises.every((ex) =>
    ex.sets.every((s) => s.completed),
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.workoutHeader}>
        <ThemedText type="title">
          Workout {state.activeWorkout.type}
        </ThemedText>
        <ThemedText style={styles.totalTime}>
          Total: {formatTime(totalTime)}
        </ThemedText>
        {state.retryWorkout && (
          <ThemedText style={styles.retryNote}>
            Retrying — previous workout failed
          </ThemedText>
        )}
      </View>

      {state.activeWorkout.exercises.map((ex, ei) => (
        <ExerciseCard
          key={ex.name}
          exercise={ex}
          index={ei}
          onToggleSet={(si) => toggleSet(ei, si)}
        />
      ))}

      <View style={styles.actionRow}>
        <Pressable
          onPress={completeWorkout}
          disabled={!allComplete}
          style={({ pressed }) => [
            styles.completeButton,
            !allComplete && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText
            style={[styles.buttonText, !allComplete && styles.buttonTextDisabled]}
          >
            Complete Workout
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={failWorkout}
          style={({ pressed }) => [
            styles.failButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText style={styles.failButtonText}>
            Fail & Deload
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={cancelWorkout}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText style={styles.cancelButtonText}>
            Cancel
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StartScreen() {
  const { state, startWorkout } = useWorkout();
  const { colorScheme } = useColorSchemeContext();

  return (
    <View style={styles.startContainer}>
        <ThemedText type="title" style={[styles.startTitle, { color: colorScheme === 'dark' ? '#e74c3c' : '#000000' }]}>StrongLog Workout Tracker</ThemedText>
      <ThemedText style={styles.startSubtitle}>
        {state.retryWorkout
          ? `Retry Workout ${state.nextWorkoutType}`
          : `Next: Workout ${state.nextWorkoutType}`}
      </ThemedText>
      <ThemedText style={styles.startInfo}>
        {state.nextWorkoutType === 'A'
          ? 'Squat · Bench Press · Barbell Row'
          : 'Squat · Overhead Press · Deadlift'}
      </ThemedText>
      <Pressable onPress={startWorkout} style={styles.startButton}>
        <ThemedText style={styles.startButtonText}>
          Start Workout
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function WorkoutScreen() {
  const { state } = useWorkout();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {state.activeWorkout ? <ActiveWorkoutView /> : <StartScreen />}
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
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.three, gap: Spacing.three },
  workoutHeader: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two },
  totalTime: { fontSize: 18, fontWeight: '600' },
  retryNote: { color: '#e67e22', fontWeight: '600', fontSize: 14 },
  exerciseCard: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: { fontSize: 22 },
  exerciseWeight: { fontSize: 18, fontWeight: '700' },
  exerciseProgress: { fontSize: 13, opacity: 0.7 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  setCirclePressable: { padding: 4 },
  setCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  setCircleCompleted: {
    borderColor: RED_MUTED,
  },
  setCircleInProgress: {
    borderColor: RED,
    backgroundColor: RED_LIGHT,
  },
  setCircleInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCircleInnerFilled: {
    backgroundColor: RED,
  },
  setCircleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  setLabel: { fontSize: 15, fontWeight: '600', width: 50 },
  setWeight: { fontSize: 15, flex: 1 },
  setTimer: { fontSize: 15, fontWeight: '600', width: 60, textAlign: 'right' },
  actionRow: { gap: Spacing.two, paddingTop: Spacing.one },
  completeButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  failButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  buttonTextDisabled: { color: '#fff' },
  failButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelButtonText: { color: '#999', fontSize: 15 },
  startContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  startTitle: { fontSize: 32, lineHeight: 38, textAlign: 'center' },
  startSubtitle: { fontSize: 22, fontWeight: '600' },
  startInfo: { fontSize: 15, opacity: 0.7, textAlign: 'center' },
  startButton: {
    backgroundColor: '#3c87f7',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: Spacing.three,
  },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
