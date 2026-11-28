import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Palette } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUpdatePreferences } from '../hooks/useProfile';
import { useMindshiftStore } from '../store/useMindshiftStore';
import {
  CUSTOM_THEME_PRESETS,
  DEFAULT_CUSTOM_THEME,
  FONT_FAMILIES,
  RADIUS,
  SPACING,
  THEME_COLOR_SWATCHES,
} from '../theme';
import type { CustomThemeConfig, ThemePreference } from '../types';

const COLOR_LABELS: { key: keyof CustomThemeConfig; label: string }[] = [
  { key: 'lightBackground', label: 'Screen Background' },
  { key: 'white', label: 'Card Surface' },
  { key: 'primaryNavy', label: 'Primary Color' },
  { key: 'secondaryTeal', label: 'Accent Color' },
];

export function ThemePickerCard() {
  const theme = useAppTheme();
  const currentMode = useMindshiftStore((s) => s.settings.theme);
  const customTheme =
    useMindshiftStore((s) => s.settings.customTheme) ?? DEFAULT_CUSTOM_THEME;
  const updateSettings = useMindshiftStore((s) => s.updateSettings);
  const updatePreferences = useUpdatePreferences();

  const handleSelectMode = (mode: ThemePreference) => {
    void updateSettings({ theme: mode });
    if (mode === 'light' || mode === 'dark') {
      updatePreferences.mutate({ theme: mode });
    }
  };

  const handleSelectPreset = (config: CustomThemeConfig) => {
    void updateSettings({ theme: 'custom', customTheme: config });
  };

  const handleSelectSwatch = (key: keyof CustomThemeConfig, hex: string) => {
    void updateSettings({
      theme: 'custom',
      customTheme: {
        ...customTheme,
        [key]: hex,
      },
    });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
        theme.shadow,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Palette size={17} color={theme.colors.secondaryTeal} />
          <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }]}>
            Theme & Appearance
          </Text>
        </View>
        <Text style={[styles.modeBadge, { color: theme.colors.secondaryTeal }]}>
          {currentMode.toUpperCase()}
        </Text>
      </View>

      <View style={styles.modeRow}>
        {(
          [
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
            { id: 'custom', label: 'Custom' },
          ] as const
        ).map((m) => {
          const selected = currentMode === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => handleSelectMode(m.id)}
              style={[
                styles.modeChip,
                {
                  backgroundColor: selected
                    ? theme.colors.secondaryTeal
                    : theme.colors.mutedSurface,
                  borderColor: selected
                    ? theme.colors.secondaryTeal
                    : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: selected ? '#FFFFFF' : theme.colors.primaryText },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {currentMode === 'custom' ? (
        <View style={[styles.customBox, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.subTitle, { color: theme.colors.primaryText }]}>
            Quick Presets
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetRow}
          >
            {CUSTOM_THEME_PRESETS.map((preset) => {
              const isSelected =
                customTheme.primaryNavy === preset.config.primaryNavy &&
                customTheme.secondaryTeal === preset.config.secondaryTeal &&
                customTheme.lightBackground === preset.config.lightBackground &&
                customTheme.white === preset.config.white;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handleSelectPreset(preset.config)}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: preset.config.lightBackground,
                      borderColor: isSelected
                        ? theme.colors.secondaryTeal
                        : theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.presetDots}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: preset.config.primaryNavy },
                      ]}
                    />
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: preset.config.secondaryTeal },
                      ]}
                    />
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: preset.config.white,
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.presetLabel,
                      {
                        color:
                          preset.config.lightBackground.startsWith('#0')
                            ? '#F8FAFC'
                            : '#071F3D',
                      },
                    ]}
                  >
                    {preset.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.subTitle, { color: theme.colors.primaryText }]}>
            Customize Colors
          </Text>
          {COLOR_LABELS.map(({ key, label }) => {
            const activeHex = customTheme[key];
            return (
              <View key={key} style={styles.swatchGroup}>
                <Text
                  style={[styles.swatchLabel, { color: theme.colors.secondaryText }]}
                >
                  {label}
                </Text>
                <View style={styles.swatchRow}>
                  {THEME_COLOR_SWATCHES[key].map((hex) => {
                    const selected = activeHex.toLowerCase() === hex.toLowerCase();
                    return (
                      <Pressable
                        key={`${key}-${hex}`}
                        onPress={() => handleSelectSwatch(key, hex)}
                        style={[
                          styles.swatchCircle,
                          {
                            backgroundColor: hex,
                            borderColor: selected
                              ? theme.colors.secondaryTeal
                              : theme.colors.border,
                            borderWidth: selected ? 2.5 : 1,
                          },
                        ]}
                      >
                        {selected ? (
                          <Check
                            size={14}
                            color={
                              hex === '#FFFFFF' ||
                              hex === '#F8FAFC' ||
                              hex === '#FEFCE8' ||
                              hex === '#F0FDFA' ||
                              hex === '#E8F8F3' ||
                              hex === '#EEF2FF' ||
                              hex === '#FFF7ED' ||
                              hex === '#F0FDF4' ||
                              hex === '#FDF2F8'
                                ? '#071F3D'
                                : '#FFFFFF'
                            }
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeBadge: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 11,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  customBox: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  subTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  presetRow: {
    gap: 8,
    paddingVertical: 2,
  },
  presetChip: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    minWidth: 108,
  },
  presetDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  presetLabel: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
  },
  swatchGroup: {
    gap: 6,
    marginTop: 2,
  },
  swatchLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
