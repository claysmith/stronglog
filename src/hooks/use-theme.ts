import { Colors } from '@/constants/theme';
import { useColorSchemeContext } from '@/context/color-scheme-context';

export function useTheme() {
  const { colorScheme } = useColorSchemeContext();
  return Colors[colorScheme];
}
