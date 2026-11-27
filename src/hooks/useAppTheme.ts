import { useMemo } from 'react';
import { useMindshiftStore } from '../store/useMindshiftStore';
import { getTheme, MindshiftTheme } from '../theme';

export function useAppTheme(): MindshiftTheme {
  const mode = useMindshiftStore((s) => s.settings.theme);
  return useMemo(() => getTheme(mode), [mode]);
}
