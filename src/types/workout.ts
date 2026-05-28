export type WorkoutType = 'A' | 'B';

export interface ExerciseConfig {
  name: string;
  targetSets: number;
  targetReps: number;
}

export const WORKOUT_A_EXERCISES: ExerciseConfig[] = [
  { name: 'Squat', targetSets: 5, targetReps: 5 },
  { name: 'Bench Press', targetSets: 5, targetReps: 5 },
  { name: 'Barbell Row', targetSets: 5, targetReps: 5 },
];

export const WORKOUT_B_EXERCISES: ExerciseConfig[] = [
  { name: 'Squat', targetSets: 5, targetReps: 5 },
  { name: 'Overhead Press', targetSets: 5, targetReps: 5 },
  { name: 'Deadlift', targetSets: 5, targetReps: 5 },
];

export const DEFAULT_STARTING_WEIGHT = 45;
export const DEFAULT_INCREMENT = 5;
export const DEFAULT_DELOAD = 10;

export interface ExerciseProgression {
  currentWeight: number;
  increment: number;
  deloadAmount: number;
  startingWeight: number;
}

export interface SetData {
  setNumber: number;
  completed: boolean;
  elapsed: number;
  inProgress: boolean;
  startedAt: string | null;
}

export interface ActiveExercise {
  name: string;
  weight: number;
  targetReps: number;
  sets: SetData[];
}

export interface ActiveWorkout {
  type: WorkoutType;
  startedAt: string;
  exercises: ActiveExercise[];
}

export interface CompletedSet {
  setNumber: number;
  reps: number;
  duration: number;
  completed: boolean;
}

export interface CompletedExercise {
  name: string;
  weight: number;
  targetReps: number;
  sets: CompletedSet[];
}

export interface CompletedWorkout {
  type: WorkoutType;
  date: string;
  startedAt: string;
  exercises: CompletedExercise[];
  failed: boolean;
}

export interface WorkoutSettings {
  startingWeight: number;
  increment: number;
  deloadAmount: number;
}

export interface AppState {
  nextWorkoutType: WorkoutType;
  retryWorkout: boolean;
  progression: Record<string, ExerciseProgression>;
  settings: WorkoutSettings;
  activeWorkout: ActiveWorkout | null;
  history: CompletedWorkout[];
}

export const ALL_EXERCISES = ['Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Deadlift'] as const;

export function getExercisesForType(type: WorkoutType): ExerciseConfig[] {
  return type === 'A' ? WORKOUT_A_EXERCISES : WORKOUT_B_EXERCISES;
}
