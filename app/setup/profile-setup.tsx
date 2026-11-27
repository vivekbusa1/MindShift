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
  AvatarBadge,
  CustomInput,
  PrimaryButton,
} from '../../src/components';
import {
  AGE_GROUPS,
  AVATAR_OPTIONS,
  INTEREST_OPTIONS,
  PROFESSION_OPTIONS,
  ROUTINE_OPTIONS,
  TIMEZONE_OPTIONS,
  WORKLOAD_OPTIONS,
} from '../../src/constants';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useProfile, useUpdateProfile } from '../../src/hooks/useProfile';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';
import {
  AgeGroup,
  PreferredRoutine,
  ProfessionOption,
  WorkloadLevel,
} from '../../src/types';

export default function ProfileSetupScreen() {
  const theme = useAppTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEdit = mode === 'edit';

  const { data: existing } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState(existing?.fullName ?? '');
  const [nickname, setNickname] = useState(existing?.nickname ?? '');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(existing?.ageGroup ?? '18-24');
  const [avatarId, setAvatarId] = useState(existing?.avatarId ?? 'avatar-1');
  const [profession, setProfession] = useState<ProfessionOption>(
    existing?.profession ?? 'Student'
  );
  const [customProfession, setCustomProfession] = useState(existing?.customProfession ?? '');
  const [workload, setWorkload] = useState<WorkloadLevel>(existing?.workload ?? 'moderate');
  const [preferredRoutine, setPreferredRoutine] = useState<PreferredRoutine>(
    existing?.preferredRoutine ?? 'morning_person'
  );
  const [timezone, setTimezone] = useState(existing?.timezone ?? 'Asia/Kolkata');
  const [interests, setInterests] = useState<string[]>(existing?.interests ?? []);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!nickname.trim()) {
      setError('Please enter a nickname (shown on dashboard and leaderboard).');
      return;
    }
    if (profession === 'Other' && !customProfession.trim()) {
      setError('Please enter your custom profession.');
      return;
    }

    setError(null);

    const payload = {
      fullName: fullName.trim(),
      nickname: nickname.trim(),
      ageGroup,
      avatarId,
      profession,
      customProfession: profession === 'Other' ? customProfession.trim() : '',
      workload,
      preferredRoutine,
      timezone,
      interests,
    };

    updateProfile.mutate(payload, {
      onSuccess: () => {
        if (isEdit) {
          router.back();
        } else {
          router.replace('/setup/goal-setup');
        }
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to save profile.';
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
            title={isEdit ? 'Edit Profile' : 'Profile Setup'}
            subtitle="Tell Mindshift how your typical day is structured"
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
              Choose Your Avatar
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarRow}
            >
              {AVATAR_OPTIONS.map((av) => {
                const selected = avatarId === av.id;
                return (
                  <Pressable
                    key={av.id}
                    onPress={() => setAvatarId(av.id)}
                    style={[
                      styles.avatarChoice,
                      {
                        borderColor: selected
                          ? theme.colors.secondaryTeal
                          : theme.colors.border,
                        backgroundColor: selected
                          ? theme.colors.tealTint
                          : theme.colors.white,
                      },
                    ]}
                  >
                    <AvatarBadge
                      avatarId={av.id}
                      name={nickname || fullName}
                      size={44}
                    />
                    <Text
                      style={[
                        styles.avatarLabel,
                        { color: theme.colors.primaryText },
                      ]}
                    >
                      {av.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <CustomInput
              label="Full Name"
              placeholder="e.g. Aarav Mehta"
              value={fullName}
              onChangeText={setFullName}
            />
            <CustomInput
              label="Nickname"
              placeholder="e.g. Aarav"
              value={nickname}
              onChangeText={setNickname}
            />

            <Text style={[styles.fieldLabel, { color: theme.colors.primaryText }]}>
              Age Group
            </Text>
            <View style={styles.chipWrap}>
              {AGE_GROUPS.map((age) => (
                <Chip
                  key={age}
                  label={age}
                  selected={ageGroup === age}
                  onPress={() => setAgeGroup(age)}
                />
              ))}
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
              Profession & Routine
            </Text>

            <View style={styles.chipWrap}>
              {PROFESSION_OPTIONS.map((prof) => (
                <Chip
                  key={prof}
                  label={prof}
                  selected={profession === prof}
                  onPress={() => setProfession(prof)}
                />
              ))}
            </View>

            {profession === 'Other' ? (
              <CustomInput
                label="Custom Profession"
                placeholder="Enter your role or profession"
                value={customProfession}
                onChangeText={setCustomProfession}
              />
            ) : null}

            <Text style={[styles.fieldLabel, { color: theme.colors.primaryText }]}>
              Daily Workload
            </Text>
            <View style={styles.optionStack}>
              {WORKLOAD_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setWorkload(opt.value)}
                  style={[
                    styles.optionCard,
                    {
                      borderColor:
                        workload === opt.value
                          ? theme.colors.secondaryTeal
                          : theme.colors.border,
                      backgroundColor:
                        workload === opt.value
                          ? theme.colors.tealTint
                          : theme.colors.mutedSurface,
                    },
                  ]}
                >
                  <Text style={[styles.optionTitle, { color: theme.colors.primaryText }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionHint, { color: theme.colors.secondaryText }]}>
                    {opt.hint}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.colors.primaryText }]}>
              Preferred Routine
            </Text>
            <View style={styles.optionStack}>
              {ROUTINE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreferredRoutine(opt.value)}
                  style={[
                    styles.optionCard,
                    {
                      borderColor:
                        preferredRoutine === opt.value
                          ? theme.colors.secondaryTeal
                          : theme.colors.border,
                      backgroundColor:
                        preferredRoutine === opt.value
                          ? theme.colors.tealTint
                          : theme.colors.mutedSurface,
                    },
                  ]}
                >
                  <Text style={[styles.optionTitle, { color: theme.colors.primaryText }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionHint, { color: theme.colors.secondaryText }]}>
                    {opt.hint}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.colors.primaryText }]}>
              Timezone (used for streaks & daily reports)
            </Text>
            <View style={styles.chipWrap}>
              {TIMEZONE_OPTIONS.map((tz) => (
                <Chip
                  key={tz}
                  label={tz}
                  selected={timezone === tz}
                  onPress={() => setTimezone(tz)}
                />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.colors.primaryText }]}>
              Personal Interests
            </Text>
            <View style={styles.chipWrap}>
              {INTEREST_OPTIONS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={interests.includes(item)}
                  onPress={() => toggleInterest(item)}
                />
              ))}
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
            title={isEdit ? 'Save Profile Changes' : 'Next: Personal Goals'}
            onPress={handleSave}
            loading={updateProfile.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  sectionTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 16,
  },
  fieldLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
    marginTop: 4,
  },
  avatarRow: {
    gap: SPACING.sm,
  },
  avatarChoice: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    gap: 6,
    minWidth: 84,
  },
  avatarLabel: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 11,
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
  },
  optionStack: {
    gap: 8,
  },
  optionCard: {
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    padding: SPACING.md,
    gap: 2,
  },
  optionTitle: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  optionHint: {
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
