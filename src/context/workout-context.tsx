import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  type AppState,
  type ActiveWorkout,
  type ActiveExercise,
  type CompletedWorkout,
  type ExerciseProgression,
  type WorkoutType,
  type WorkoutSettings,
  DEFAULT_STARTING_WEIGHT,
  DEFAULT_INCREMENT,
  DEFAULT_DELOAD,
  getExercisesForType,
} from '@/types/workout';

const STORAGE_KEY = '@workout/app-state';

function defaultProgression(name: string, settings: WorkoutSettings): ExerciseProgression {
  return {
    currentWeight: settings.startingWeight,
    increment: settings.increment,
    deloadAmount: settings.deloadAmount,
    startingWeight: settings.startingWeight,
  };
}

function getDefaultState(): AppState {
  const settings: WorkoutSettings = {
    startingWeight: DEFAULT_STARTING_WEIGHT,
    increment: DEFAULT_INCREMENT,
    deloadAmount: DEFAULT_DELOAD,
  };
  return {
    nextWorkoutType: 'A',
    retryWorkout: false,
    progression: {},
    settings,
    activeWorkout: null,
    history: [],
  };
}

function buildWorkout(type: WorkoutType, progression: Record<string, ExerciseProgression>, settings: WorkoutSettings): ActiveWorkout {
  const exercises = getExercisesForType(type);
  const now = new Date().toISOString();
  const activeExercises: ActiveExercise[] = exercises.map((ex) => {
    const prog = progression[ex.name] ?? defaultProgression(ex.name, settings);
    return {
      name: ex.name,
      weight: prog.currentWeight,
      targetReps: ex.targetReps,
      sets: Array.from({ length: ex.targetSets }, (_, i) => ({
        setNumber: i + 1,
        completed: false,
        elapsed: 0,
        inProgress: false,
        startedAt: null,
      })),
    };
  });
  return { type, startedAt: now, exercises: activeExercises };
}

interface WorkoutContextValue {
  state: AppState;
  loading: boolean;
  startWorkout: () => void;
  toggleSet: (exerciseIndex: number, setIndex: number) => void;
  completeWorkout: () => void;
  failWorkout: () => void;
  cancelWorkout: () => void;
  updateSettings: (s: Partial<WorkoutSettings>) => void;
  updateProgression: (name: string, changes: Partial<ExerciseProgression>) => void;
  resetAll: () => void;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(getDefaultState);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) {
          const parsed = JSON.parse(json) as AppState;
          setState(parsed);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((s: AppState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {});
    }, 200);
  }, []);

  const updateState = useCallback(
    (fn: (prev: AppState) => AppState) => {
      setState((prev) => {
        const next = fn(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const startWorkout = useCallback(() => {
    updateState((prev) => {
      if (prev.activeWorkout) return prev;
      const type = prev.retryWorkout ? prev.nextWorkoutType : prev.nextWorkoutType;
      const workout = buildWorkout(type, prev.progression, prev.settings);
      return { ...prev, activeWorkout: workout };
    });
  }, [updateState]);

  const toggleSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      updateState((prev) => {
        if (!prev.activeWorkout) return prev;
        const exercises = prev.activeWorkout.exercises.map((ex, ei) => {
          if (ei !== exerciseIndex) return ex;
          const sets = ex.sets.map((s, si) => {
            if (si !== setIndex) return s;
            if (s.completed) return s;
            if (s.inProgress) {
              return {
                ...s,
                inProgress: false,
                completed: true,
                elapsed: Math.floor((Date.now() - new Date(s.startedAt!).getTime()) / 1000),
              };
            }
            return { ...s, inProgress: true, startedAt: new Date().toISOString() };
          });
          return { ...ex, sets };
        });
        return { ...prev, activeWorkout: { ...prev.activeWorkout, exercises } };
      });
    },
    [updateState],
  );

  const finishWorkout = useCallback(
    (failed: boolean) => {
      updateState((prev) => {
        if (!prev.activeWorkout) return prev;
        const { activeWorkout } = prev;
        const now = new Date().toISOString();
        const completed: CompletedWorkout = {
          type: activeWorkout.type,
          date: now,
          startedAt: activeWorkout.startedAt,
          exercises: activeWorkout.exercises.map((ex) => ({
            name: ex.name,
            weight: ex.weight,
            targetReps: ex.targetReps,
            sets: ex.sets.map((s) => ({
              setNumber: s.setNumber,
              reps: ex.targetReps,
              duration: s.elapsed,
              completed: s.completed,
            })),
          })),
          failed,
        };

        const progression = { ...prev.progression };
        for (const ex of activeWorkout.exercises) {
          const current = progression[ex.name];
          const allCompleted = ex.sets.every((s) => s.completed);
          if (failed || !allCompleted) {
            const deload = current?.deloadAmount ?? prev.settings.deloadAmount;
            const newWeight = Math.max(
              prev.settings.startingWeight,
              (current?.currentWeight ?? prev.settings.startingWeight) - deload,
            );
            progression[ex.name] = {
              ...(current ?? {
                increment: prev.settings.increment,
                deloadAmount: prev.settings.deloadAmount,
                startingWeight: prev.settings.startingWeight,
              }),
              currentWeight: newWeight,
            };
          } else {
            const inc = current?.increment ?? prev.settings.increment;
            progression[ex.name] = {
              ...(current ?? {
                deloadAmount: prev.settings.deloadAmount,
                startingWeight: prev.settings.startingWeight,
              }),
              increment: prev.settings.increment,
              currentWeight: (current?.currentWeight ?? prev.settings.startingWeight) + inc,
            };
          }
        }

        const history = [...prev.history, completed];
        const nextWorkoutType: WorkoutType = failed
          ? prev.nextWorkoutType
          : prev.nextWorkoutType === 'A' ? 'B' : 'A';

        return {
          ...prev,
          activeWorkout: null,
          progression,
          history,
          nextWorkoutType,
          retryWorkout: failed,
        };
      });
    },
    [updateState],
  );

  const completeWorkout = useCallback(() => finishWorkout(false), [finishWorkout]);
  const failWorkout = useCallback(() => finishWorkout(true), [finishWorkout]);

  const cancelWorkout = useCallback(() => {
    updateState((prev) => ({ ...prev, activeWorkout: null }));
  }, [updateState]);

  const updateSettings = useCallback(
    (partial: Partial<WorkoutSettings>) => {
      updateState((prev) => {
        const newSettings = { ...prev.settings, ...partial };
        return { ...prev, settings: newSettings };
      });
    },
    [updateState],
  );

  const updateProgression = useCallback(
    (name: string, changes: Partial<ExerciseProgression>) => {
      updateState((prev) => {
        const existing = prev.progression[name] ?? {
          currentWeight: prev.settings.startingWeight,
          increment: prev.settings.increment,
          deloadAmount: prev.settings.deloadAmount,
          startingWeight: prev.settings.startingWeight,
        };
        return {
          ...prev,
          progression: { ...prev.progression, [name]: { ...existing, ...changes } },
        };
      });
    },
    [updateState],
  );

  const resetAll = useCallback(() => {
    updateState(() => getDefaultState());
  }, [updateState]);

  return (
    <WorkoutContext.Provider
      value={{
        state,
        loading,
        startWorkout,
        toggleSet,
        completeWorkout,
        failWorkout,
        cancelWorkout,
        updateSettings,
        updateProgression,
        resetAll,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
