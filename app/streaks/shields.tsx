import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield } from 'lucide-react-native';
import {
  AppHeader,
  ConfirmationModal,
  EmptyState,
  PrimaryButton,
} from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useShields, useUseShield } from '../../src/hooks/useStreaks';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';
import { formatDateHeader } from '../../src/utils/date';

export default function ShieldsScreen() {
  const theme = useAppTheme();
  const { data: shieldsData } = useShields();
  const applyRecoveryShield = useUseShield();

  const [selectedMissedDay, setSelectedMissedDay] = useState<string | null>(null);

  const availableShields = shieldsData?.availableShields ?? 0;
  const missedDateKeys: string[] = shieldsData?.missedDateKeys ?? [];
  const shieldHistory: Array<{
    id: string;
    type: 'earned' | 'used';
    dateKey: string;
    note: string;
  }> = shieldsData?.history ?? [];

  const handleConfirmUse = () => {
    if (!selectedMissedDay) return;
    applyRecoveryShield.mutate(
      selectedMissedDay,
      { onSettled: () => setSelectedMissedDay(null) }
    );
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title="Recovery Shields"
          subtitle="Protect your streak on days you missed the target"
          showBack
        />

        <View
          style={[
            styles.rulesCard,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.primaryText }]}>
            How Shields Work
          </Text>
          <Text style={[styles.ruleLine, { color: theme.colors.secondaryText }]}>
            • Earn 1 shield for every 7 consecutive streak days.
          </Text>
          <Text style={[styles.ruleLine, { color: theme.colors.secondaryText }]}>
            • A shield converts a missed day into a protected day, keeping your streak alive.
          </Text>
          <Text style={[styles.ruleLine, { color: theme.colors.secondaryText }]}>
            • A protected day generates 0 activity points but preserves your streak count.
          </Text>
          <Text style={[styles.ruleLine, { color: theme.colors.secondaryText }]}>
            • Each shield can only protect 1 missed day. Consecutive misses require multiple shields.
          </Text>
        </View>

        <View
          style={[
            styles.feedbackBox,
            {
              backgroundColor:
                availableShields > 0
                  ? theme.colors.tealTint
                  : theme.colors.warningTint,
            },
          ]}
        >
          <Text
            style={[styles.feedbackText, { color: theme.colors.primaryText }]}
          >
            {availableShields > 0
              ? `You have ${availableShields} recovery shield${availableShields > 1 ? 's' : ''} available.`
              : 'No shields available. Build a 7-day streak to earn your next shield.'}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
          Missed Days ({missedDateKeys.length})
        </Text>

        {missedDateKeys.length === 0 ? (
          <EmptyState
            icon={<Shield size={24} color={theme.colors.secondaryTeal} />}
            title="No missed days"
            description="Keep logging to build your streak."
          />
        ) : (
          missedDateKeys.map((dateKey) => (
            <View
              key={dateKey}
              style={[
                styles.missedRow,
                {
                  backgroundColor: theme.colors.white,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.missedInfo}>
                <Text
                  style={[styles.missedDate, { color: theme.colors.primaryText }]}
                >
                  {formatDateHeader(dateKey)}
                </Text>
                <Text
                  style={[styles.missedKey, { color: theme.colors.secondaryText }]}
                >
                  {dateKey} • Missed goal threshold
                </Text>
              </View>
              <PrimaryButton
                title="Protect Day"
                disabled={availableShields <= 0}
                onPress={() => setSelectedMissedDay(dateKey)}
                style={styles.protectBtn}
              />
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.primaryText }]}>
          Shield History ({shieldHistory.length})
        </Text>

        {shieldHistory.length === 0 ? (
          <EmptyState
            icon={<Shield size={24} color={theme.colors.primaryNavy} />}
            title="No shield activity yet"
            description="Shield earnings and manual redemptions will appear here."
          />
        ) : (
          shieldHistory.map((item) => (
            <View
              key={item.id}
              style={[
                styles.historyCard,
                {
                  backgroundColor: theme.colors.white,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.historyHeader}>
                <Text
                  style={[
                    styles.historyType,
                    {
                      color:
                        item.type === 'earned'
                          ? theme.colors.success
                          : theme.colors.primaryNavy,
                    },
                  ]}
                >
                  {item.type === 'earned' ? 'Shield Earned' : 'Shield Used'}
                </Text>
                <Text
                  style={[styles.historyDate, { color: theme.colors.secondaryText }]}
                >
                  {item.dateKey}
                </Text>
              </View>
              <Text
                style={[styles.historyNote, { color: theme.colors.secondaryText }]}
              >
                {item.note}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmationModal
        visible={Boolean(selectedMissedDay)}
        title="Use 1 Recovery Shield?"
        message={`Apply 1 Recovery Shield to protect ${selectedMissedDay}? This protects your streak, and ${selectedMissedDay} will generate 0 activity points.`}
        confirmLabel="Use Shield"
        onCancel={() => setSelectedMissedDay(null)}
        onConfirm={handleConfirmUse}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: SPACING.base,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  rulesCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: 6,
  },
  cardTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 15,
    marginBottom: 2,
  },
  ruleLine: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  feedbackBox: {
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
  },
  feedbackText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 16,
    marginTop: 4,
  },
  missedRow: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  missedInfo: {
    flex: 1,
  },
  missedDate: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
  },
  missedKey: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
  protectBtn: {
    minHeight: 40,
    paddingHorizontal: SPACING.md,
  },
  historyCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyType: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
  historyDate: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
  historyNote: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
    lineHeight: 18,
  },
});
