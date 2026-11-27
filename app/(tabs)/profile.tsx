import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3, Bell, ChevronRight, CheckSquare,
  Flame, LogOut, Moon, Shield, Sparkles, Target, UserCog,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { AppHeader, AvatarBadge, ConfirmationModal } from '../../src/components';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useProfile } from '../../src/hooks/useProfile';
import { useStreak, useShields } from '../../src/hooks/useStreaks';
import { useLogout } from '../../src/hooks/useAuth';
import { FONT_FAMILIES, RADIUS, SPACING } from '../../src/theme';

export default function ProfileTabScreen() {
  const theme = useAppTheme();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: streak } = useStreak();
  const { data: shields = [] } = useShields();
  const logout = useLogout();

  const [confirmLogout, setConfirmLogout] = useState(false);

  const name = profile?.fullName ?? 'Mindshift User';
  const nick = profile?.nickname ?? 'You';
  const profession = profile?.customProfession ?? profile?.profession ?? '—';

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.lightBackground }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppHeader title="Profile & Settings" subtitle="Account, goals and preferences" />

        {/* User Card */}
        {profileLoading ? (
          <ActivityIndicator color={theme.colors.secondaryTeal} />
        ) : (
          <View style={[styles.profileCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }, theme.shadow]}>
            <AvatarBadge avatarId={profile?.avatarId ?? 'avatar-1'} name={nick} size={60} />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: theme.colors.primaryText }]}>{name} ({nick})</Text>
              <Text style={[styles.meta, { color: theme.colors.secondaryText }]}>{profession} • {profile?.preferredRoutine ?? '—'}</Text>
              <Text style={[styles.meta, { color: theme.colors.secondaryTeal }]}>{profile?.timezone ?? 'UTC'}</Text>
            </View>
          </View>
        )}

        {/* Account & Routine */}
        <SectionCard title="Account & Routine">
          <MenuRow icon={<UserCog size={18} color={theme.colors.secondaryTeal} />} label="Edit Profile" sub="Name, profession, routine, interests" onPress={() => router.push({ pathname: '/setup/profile-setup', params: { mode: 'edit' } })} />
          <MenuRow icon={<Target size={18} color={theme.colors.secondaryTeal} />} label="Personal Goals" sub="Sleep, workout, study targets" onPress={() => router.push({ pathname: '/setup/goal-setup', params: { mode: 'edit' } })} />
          <MenuRow icon={<CheckSquare size={18} color={theme.colors.secondaryTeal} />} label="My Activities" sub="Custom activities & tracking rules" onPress={() => router.push('/(tabs)/activities')} />
          <MenuRow icon={<Moon size={18} color={theme.colors.primaryNavy} />} label="Sleep Summary" sub="Sleep sessions & consistency" onPress={() => router.push('/sleep')} />
        </SectionCard>

        {/* Progress & Gamification */}
        <SectionCard title="Progress & Gamification">
          <MenuRow icon={<BarChart3 size={18} color={theme.colors.secondaryTeal} />} label="Report History" sub="Daily, weekly & monthly insights" onPress={() => router.push('/(tabs)/reports')} />
          <MenuRow icon={<Flame size={18} color={theme.colors.warning} />} label="Streak Achievements" sub={`${streak?.currentStreak ?? 0} day streak • ${streak?.longestStreak ?? 0} best`} onPress={() => router.push('/streaks')} />
          <MenuRow icon={<Shield size={18} color={theme.colors.secondaryTeal} />} label="Recovery Shields" sub={`${shields.length} available`} onPress={() => router.push('/streaks/shields')} />
          <MenuRow icon={<Sparkles size={18} color={theme.colors.secondaryTeal} />} label="Personal Guidance" sub="AI-powered lifestyle suggestions" onPress={() => router.push('/reports/guidance')} />
        </SectionCard>

        {/* Preferences */}
        <SectionCard title="Preferences">
          <MenuRow icon={<Bell size={18} color={theme.colors.primaryNavy} />} label="Notifications & Privacy" sub="Configure alerts and appearance" onPress={() => router.push('/settings/preferences')} />
          <MenuRow icon={<LogOut size={18} color={theme.colors.error} />} label="Logout" sub="Sign out of your account" danger onPress={() => setConfirmLogout(true)} />
        </SectionCard>
      </ScrollView>

      <ConfirmationModal
        visible={confirmLogout}
        title="Sign Out of Mindshift?"
        message="You will need to log in again to access your data."
        confirmLabel="Logout"
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setConfirmLogout(false);
          await logout.mutateAsync();
        }}
      />
    </SafeAreaView>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.colors.white, borderColor: theme.colors.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }]}>{title}</Text>
      {children}
    </View>
  );
}

function MenuRow({ icon, label, sub, onPress, danger = false }: { icon: React.ReactNode; label: string; sub: string; onPress: () => void; danger?: boolean }) {
  const theme = useAppTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, { borderTopColor: theme.colors.border, opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? theme.colors.errorTint : theme.colors.mutedSurface }]}>{icon}</View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, { color: danger ? theme.colors.error : theme.colors.primaryText }]}>{label}</Text>
        <Text style={[styles.menuSub, { color: theme.colors.secondaryText }]}>{sub}</Text>
      </View>
      <ChevronRight size={17} color={theme.colors.secondaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.base, gap: SPACING.md, paddingBottom: SPACING.xxl },
  profileCard: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.base, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontFamily: FONT_FAMILIES.bold, fontSize: 16 },
  meta: { fontFamily: FONT_FAMILIES.regular, fontSize: 12 },
  sectionCard: { borderRadius: RADIUS.lg, borderWidth: 1, paddingTop: SPACING.md, overflow: 'hidden' },
  sectionTitle: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 12, paddingHorizontal: SPACING.base, paddingBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, borderTopWidth: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontFamily: FONT_FAMILIES.semiBold, fontSize: 14 },
  menuSub: { fontFamily: FONT_FAMILIES.regular, fontSize: 11 },
});
