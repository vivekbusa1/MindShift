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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AppHeader,
  ConfirmationModal,
  CustomInput,
  PrimaryButton,
  SecondaryButton,
} from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import {
  useActivities,
  useCreateActivity,
  useDeleteActivity,
} from '../../src/hooks/useActivities';
import { activitiesApi } from '../../src/services/api';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

type BackendCategory =
  | 'fitness'
  | 'productivity'
  | 'nutrition'
  | 'mindfulness'
  | 'sleep'
  | 'custom';

const CATEGORY_OPTIONS: { id: BackendCategory; label: string }[] = [
  { id: 'fitness', label: 'Fitness' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'custom', label: 'Custom' },
];

export default function CreateOrEditActivityScreen() {
  const theme = useAppTheme();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: activities = [] } = useActivities();
  const createActivity = useCreateActivity();
  const deleteActivity = useDeleteActivity();

  const updateActivity = useMutation({
    mutationFn: ({ actId, data }: { actId: string; data: Record<string, unknown> }) =>
      activitiesApi.updateActivity(actId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });

  const existing = (activities as Array<{
    id: string;
    name: string;
    category: BackendCategory;
    unit?: string;
    aliases?: string[];
    scoreWeight?: number;
    isDefault?: boolean;
  }>).find((a) => a.id === id);
  const isEditing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [aliasesText, setAliasesText] = useState(
    existing?.aliases?.join(', ') ?? ''
  );
  const [category, setCategory] = useState<BackendCategory>(
    existing?.category ?? 'custom'
  );
  const [unit, setUnit] = useState(existing?.unit ?? 'min');
  const [scoreWeight, setScoreWeight] = useState(
    String(existing?.scoreWeight ?? 1.0)
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Activity name is required.');
      return;
    }

    const weightNum = Math.min(5, Math.max(0.5, Number(scoreWeight) || 1.0));
    const aliases = aliasesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setError(null);
    const payload = {
      name: trimmedName,
      aliases,
      category,
      unit: unit.trim() || 'min',
      scoreWeight: weightNum,
    };

    const onError = (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to save activity.');
    };

    if (existing) {
      updateActivity.mutate(
        { actId: existing.id, data: payload },
        { onSuccess: () => router.back(), onError }
      );
    } else {
      createActivity.mutate(payload, {
        onSuccess: () => router.back(),
        onError,
      });
    }
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
            title={isEditing ? 'Edit Activity' : 'Create Custom Activity'}
            subtitle="Track anything that fits your personal routine"
            showBack
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
            <CustomInput
              label="Activity Name"
              placeholder="e.g. Yoga, Guitar, Hydration, Coding"
              value={name}
              onChangeText={setName}
            />

            <CustomInput
              label="Message Aliases (comma-separated, optional)"
              placeholder="e.g. stretch, mobility"
              value={aliasesText}
              onChangeText={setAliasesText}
              hint="Parser matches both activity name and aliases case-insensitively."
            />

            <Text style={[styles.label, { color: theme.colors.primaryText }]}>
              Category
            </Text>
            <View style={styles.chipWrap}>
              {CATEGORY_OPTIONS.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  selected={category === cat.id}
                  onPress={() => setCategory(cat.id)}
                />
              ))}
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.flex}>
                <CustomInput
                  label="Measurement Unit"
                  placeholder="min, ml, pages"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
              <View style={styles.flex}>
                <CustomInput
                  label="Score Weight (0.5–5)"
                  keyboardType="decimal-pad"
                  value={scoreWeight}
                  onChangeText={setScoreWeight}
                />
              </View>
            </View>
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
            title={isEditing ? 'Save Changes' : 'Create Activity'}
            onPress={handleSave}
            loading={createActivity.isPending || updateActivity.isPending}
          />

          {isEditing && !existing?.isDefault ? (
            <SecondaryButton
              title="Delete Custom Activity"
              onPress={() => setConfirmDelete(true)}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={confirmDelete}
        title="Delete Custom Activity?"
        message={`Delete "${existing?.name}"? Existing historical logs remain preserved in your timeline.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (existing) {
            deleteActivity.mutate(existing.id, {
              onSettled: () => {
                setConfirmDelete(false);
                router.back();
              },
            });
          }
        }}
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
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
          styles.chipText,
          { color: selected ? '#FFFFFF' : theme.colors.primaryText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
  label: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
