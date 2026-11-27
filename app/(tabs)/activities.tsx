import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, History, Moon, Plus, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { ActivityCard, AppHeader, ConfirmationModal, CustomInput, EmptyState, PrimaryButton } from '../../src/components';
import { CATEGORY_META } from '../../src/constants';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useActivities, useDeleteActivity } from '../../src/hooks/useActivities';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

export default function ActivitiesTabScreen() {
  const theme = useAppTheme();
  const { data: activities = [], isLoading } = useActivities();
  const deleteActivity = useDeleteActivity();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toDelete, setToDelete] = useState<string | null>(null);

  const filtered = activities.filter((act: Record<string, unknown>) => {
    const q = query.trim().toLowerCase();
    if (selectedCategory !== 'all' && act.category !== selectedCategory) return false;
    if (!q) return true;
    return (
      (act.name as string).toLowerCase().includes(q) ||
      ((act.aliases as string[]) ?? []).some((al) => al.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader
          title="Activities"
          subtitle="All activities from your backend"
          rightSlot={
            <Pressable onPress={() => router.push('/activities/create')} style={[styles.addBtn, { backgroundColor: theme.colors.secondaryTeal }]}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          }
        />

        {/* Shortcuts */}
        <View style={styles.shortcutRow}>
          {[
            { label: 'Sleep Tracker', icon: <Moon size={18} color={theme.colors.primaryNavy} />, path: '/sleep' },
            { label: 'Late Entry', icon: <Clock size={18} color={theme.colors.warning} />, path: '/activities/late-entry' },
            { label: 'History', icon: <History size={18} color={theme.colors.secondaryTeal} />, path: '/activities/history' },
          ].map((s) => (
            <Pressable key={s.label} onPress={() => router.push(s.path as never)} style={[styles.shortcutCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
              {s.icon}
              <Text style={[styles.shortcutText, { color: theme.colors.primaryText }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        <CustomInput placeholder="Search activities..." value={query} onChangeText={setQuery} leftIcon={<Search size={18} color={theme.colors.secondaryText} />} />

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['all', ...Object.keys(CATEGORY_META)].map((cat) => (
            <Pressable key={cat} onPress={() => setSelectedCategory(cat)}
              style={[styles.chip, { backgroundColor: selectedCategory === cat ? theme.colors.primaryNavy : theme.colors.white, borderColor: selectedCategory === cat ? theme.colors.primaryNavy : theme.colors.border }]}>
              <Text style={[styles.chipText, { color: selectedCategory === cat ? '#FFF' : theme.colors.primaryText }]}>
                {cat === 'all' ? 'All' : CATEGORY_META[cat as keyof typeof CATEGORY_META]?.shortLabel ?? cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.countLabel, { color: theme.colors.secondaryText }]}>
          {isLoading ? 'Loading...' : `${filtered.length} activities`}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={theme.colors.secondaryTeal} style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching activities" description="Try clearing your search or create a custom activity." actionLabel="Create Activity" onAction={() => router.push('/activities/create')} />
        ) : (
          <View style={styles.list}>
            {filtered.map((act: Record<string, unknown>) => (
              <ActivityCard
                key={act.id as string}
                activity={{
                  id: act.id as string,
                  name: act.name as string,
                  category: (act.category as string) as import('../../src/types').ActivityCategory,
                  unit: (act.unit as string | undefined) ?? 'min',
                  isDefault: act.isDefault as boolean,
                  iconName: (act.icon as string | undefined) ?? 'Activity',
                  createdAt: (act.createdAt as string | undefined) ?? '',
                  updatedAt: (act.updatedAt as string | undefined) ?? '',
                  aliases: (act.aliases as string[]) ?? [],
                  scoringRule: { mode: 'consistency_check', maxPointsForRule: 10, deductionOnConfirmedMiss: 0 },
                  isArchived: false,
                  trackingType: 'single_event',
                  targetValue: 1,
                  repeatFrequency: 'daily',
                }}
                onPress={() => router.push({ pathname: '/activities/history', params: { activityId: act.id as string } })}
                onEdit={() => act.isCustom ? router.push({ pathname: '/activities/create', params: { id: act.id as string } }) : undefined}
                onToggleArchive={act.isCustom ? () => setToDelete(act.id as string) : undefined}
              />
            ))}
          </View>
        )}

        <PrimaryButton title="Create Custom Activity" onPress={() => router.push('/activities/create')} icon={<Plus size={18} color="#FFFFFF" />} />
      </ScrollView>

      <ConfirmationModal
        visible={Boolean(toDelete)}
        title="Delete Activity?"
        message="This will permanently delete this custom activity and all its logs."
        confirmLabel="Delete"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteActivity.mutateAsync(toDelete);
          setToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING.xxl },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill },
  addBtnText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 13, color: '#FFF' },
  shortcutRow: { flexDirection: 'row', gap: 8 },
  shortcutCard: { flex: 1, borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  shortcutText: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 11, textAlign: 'center' },
  filterRow: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1 },
  chipText: { fontFamily: FONT_FAMILIES.medium, fontSize: 12 },
  countLabel: { fontFamily: FONT_FAMILIES.medium, fontSize: 12 },
  list: { gap: SPACING.sm },
});
