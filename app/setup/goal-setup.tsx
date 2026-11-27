import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppHeader,
  CustomInput,
  DateTimePickerField,
  PrimaryButton,
} from '../../src/components';
import { CATEGORY_META } from '../../src/constants';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useGoals, useUpdateGoals } from '../../src/hooks/useProfile';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';
import { ActivityCategory } from '../../src/types';
import { parseHHMMToMinutes } from '../../src/utils/date';

function hhmmToDate(hhmm: string): Date {
  const mins = parseHHMMToMinutes(hhmm);
  const d = new Date();
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
}

function dateToHHMM(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function GoalSetupScreen() {
  const theme = useAppTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEdit = mode === 'edit';

  const { data: existing } = useGoals();
  const updateGoals = useUpdateGoals();

  const [selectedCategories, setSelectedCategories] = useState<ActivityCategory[]>(
    existing?.selectedCategories ?? ['fitness', 'sleep', 'productivity']
  );
  const [wakeDate, setWakeDate] = useState<Date>(() =>
    hhmmToDate(existing?.preferredWakeTime ?? '06:30')
  );
  const [bedDate, setBedDate] = useState<Date>(() =>
    hhmmToDate(existing?.preferredBedTime ?? '23:00')
  );
  const [sleepHours, setSleepHours] = useState(
    String(Math.round(((existing?.sleepDurationMinutes ?? 480) / 60) * 10) / 10)
  );
  const [workoutMins, setWorkoutMins] = useState(
    String(existing?.workoutDurationMinutes ?? 30)
  );
  const [workStudyHours, setWorkStudyHours] = useState(
    String(Math.round(((existing?.workStudyDurationMinutes ?? 240) / 60) * 10) / 10)
  );
  const [waterMl, setWaterMl] = useState(String(existing?.waterTargetMl ?? 2000));
  const [readingMins, setReadingMins] = useState(
    String(existing?.readingTargetMinutes ?? 20)
  );
  const [walkMins, setWalkMins] = useState(
    String(existing?.dailyStepOrWalkMinutes ?? 30)
  );
  const [customFocusNote, setCustomFocusNote] = useState(existing?.customFocusNote ?? '');
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: ActivityCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    const sleepNum = Number(sleepHours);
    const workoutNum = Number(workoutMins);
    const studyNum = Number(workStudyHours);
    const waterNum = Number(waterMl);
    const readNum = Number(readingMins);
    const walkNum = Number(walkMins);

    if (selectedCategories.length === 0) {
      setError('Select at least one focus area.');
      return;
    }
    if (Number.isNaN(sleepNum) || sleepNum < 4 || sleepNum > 12) {
      setError('Sleep goal should be between 4 and 12 hours.');
      return;
    }
    if (Number.isNaN(workoutNum) || workoutNum < 0 || workoutNum > 240) {
      setError('Workout duration should be between 0 and 240 minutes.');
      return;
    }
    if (Number.isNaN(studyNum) || studyNum < 0.5 || studyNum > 14) {
      setError('Work or study goal should be between 0.5 and 14 hours.');
      return;
    }

    setError(null);

    const payload = {
      selectedCategories,
      preferredWakeTime: dateToHHMM(wakeDate),
      preferredBedTime: dateToHHMM(bedDate),
      sleepDurationMinutes: Math.round(sleepNum * 60),
      workoutDurationMinutes: Math.round(workoutNum),
      workStudyDurationMinutes: Math.round(studyNum * 60),
      waterTargetMl: Math.max(500, Math.round(waterNum || 2000)),
      readingTargetMinutes: Math.max(5, Math.round(readNum || 20)),
      dailyStepOrWalkMinutes: Math.max(10, Math.round(walkNum || 30)),
      customFocusNote: customFocusNote.trim(),
    };

    updateGoals.mutate(payload, {
      onSuccess: () => {
        if (isEdit) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to save goals.';
        setError(msg);
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <AppHeader
            title={isEdit ? 'Edit Goals' : 'Personal Goals'}
            subtitle="Set daily targets that fit your lifestyle"
            showBack={isEdit}
          />

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.white,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
              Focus Areas
            </Text>
            <View style={styles.catList}>
              {(Object.entries(CATEGORY_META) as [ActivityCategory, typeof CATEGORY_META[ActivityCategory]][]).map(
                ([cat, meta]) => {
                  const selected = selectedCategories.includes(cat);
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => toggleCategory(cat)}
                      style={[
                        styles.catItem,
                        {
                          borderColor: selected
                            ? theme.colors.secondaryTeal
                            : theme.colors.border,
                          backgroundColor: selected
                            ? theme.colors.tealTint
                            : theme.colors.mutedSurface,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.catTitle, { color: theme.colors.primaryText }]}
                      >
                        {meta.label}
                      </Text>
                      <Text
                        style={[styles.catDesc, { color: theme.colors.secondaryText }]}
                      >
                        {meta.description}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.white,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
              Schedule & Daily Targets
            </Text>

            <DateTimePickerField
              label="Preferred Wake-Up Time"
              mode="time"
              value={wakeDate}
              onChange={setWakeDate}
            />

            <DateTimePickerField
              label="Preferred Bedtime"
              mode="time"
              value={bedDate}
              onChange={setBedDate}
            />

            <CustomInput
              label="Sleep Duration Goal (hours)"
              keyboardType="decimal-pad"
              value={sleepHours}
              onChangeText={setSleepHours}
              hint="Suggested: 7.5 to 8.5 hours"
            />

            <CustomInput
              label="Workout Duration Goal (minutes/day)"
              keyboardType="number-pad"
              value={workoutMins}
              onChangeText={setWorkoutMins}
              hint="Suggested: 30 to 45 minutes"
            />

            <CustomInput
              label="Work / Study Focus Goal (hours/day)"
              keyboardType="decimal-pad"
              value={workStudyHours}
              onChangeText={setWorkStudyHours}
              hint="Suggested: 3 to 6 focused hours"
            />

            <CustomInput
              label="Daily Water Target (ml)"
              keyboardType="number-pad"
              value={waterMl}
              onChangeText={setWaterMl}
            />

            <CustomInput
              label="Walking Target (minutes/day)"
              keyboardType="number-pad"
              value={walkMins}
              onChangeText={setWalkMins}
            />

            <CustomInput
              label="Personal Development / Reading (minutes/day)"
              keyboardType="number-pad"
              value={readingMins}
              onChangeText={setReadingMins}
            />

            <CustomInput
              label="Personal Focus Note (optional)"
              placeholder="What matters most in your routine right now?"
              value={customFocusNote}
              onChangeText={setCustomFocusNote}
              multiline
            />
          </View>

          {error ? (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: theme.colors.errorTint },
              ]}
            >
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            title={isEdit ? 'Save Goals' : 'Finish Setup & Open Dashboard'}
            onPress={handleSave}
            loading={updateGoals.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: SPACING.base,
    gap: SPACING.base,
    paddingBottom: SPACING.xxl,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 16,
  },
  catList: {
    gap: 8,
  },
  catItem: {
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    padding: SPACING.md,
    gap: 2,
  },
  catTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
  },
  catDesc: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
  errorBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  errorText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
  },
});
