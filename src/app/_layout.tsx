import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { WorkoutProvider } from '@/context/workout-context';
import { ColorSchemeProvider, useColorSchemeContext } from '@/context/color-scheme-context';
import AppTabs from '@/components/app-tabs';

function LayoutWithTheme() {
  const { colorScheme } = useColorSchemeContext();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WorkoutProvider>
        <AppTabs />
      </WorkoutProvider>
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <ColorSchemeProvider>
      <LayoutWithTheme />
    </ColorSchemeProvider>
  );
}
