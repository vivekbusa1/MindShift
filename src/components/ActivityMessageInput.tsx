import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BookOpen,
  Droplets,
  Dumbbell,
  Footprints,
  Moon,
  Send,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react-native';
import { QUICK_ACTIVITY_SUGGESTIONS } from '../constants';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

interface ActivityMessageInputProps {
  onSubmitMessage: (message: string) => void;
  suggestions?: string[];
  activeSessions?: string[];
  placeholder?: string;
}

function SuggestionIcon({ label, color }: { label: string; color: string }) {
  const lower = label.toLowerCase();
  if (lower.includes('wake')) return <Sun size={13} color={color} />;
  if (lower.includes('sleep') || lower.includes('bed')) return <Moon size={13} color={color} />;
  if (lower.includes('water') || lower.includes('drink')) return <Droplets size={13} color={color} />;
  if (lower.includes('workout') || lower.includes('gym') || lower.includes('exercise')) {
    return <Dumbbell size={13} color={color} />;
  }
  if (lower.includes('walk') || lower.includes('run')) return <Footprints size={13} color={color} />;
  if (lower.includes('study') || lower.includes('read') || lower.includes('work')) {
    return <BookOpen size={13} color={color} />;
  }
  return <Sparkles size={13} color={color} />;
}

export function ActivityMessageInput({
  onSubmitMessage,
  suggestions = QUICK_ACTIVITY_SUGGESTIONS,
  activeSessions = [],
  placeholder = 'e.g. "Workout 30 min", "Water 2 glasses"...',
}: ActivityMessageInputProps) {
  const theme = useAppTheme();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const hasText = text.trim().length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmitMessage(trimmed);
    setText('');
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
        theme.shadow,
      ]}
    >
      {/* Top Accent Bar */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: theme.colors.secondaryTeal },
        ]}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: theme.colors.tealTint },
            ]}
          >
            <Zap size={16} color={theme.colors.secondaryTeal} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.colors.primaryText }]}>
              Quick Activity
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
              Type naturally or tap a 1-tap preset
            </Text>
          </View>
        </View>

        {activeSessions.length > 0 ? (
          <View
            style={[styles.badgePill, { backgroundColor: theme.colors.tealTint }]}
          >
            <Text style={[styles.badgeText, { color: theme.colors.secondaryTeal }]}>
              {`Active: ${activeSessions.join(', ')}`}
            </Text>
          </View>
        ) : (
          <View
            style={[styles.badgePill, { backgroundColor: theme.colors.navyTint }]}
          >
            <Text style={[styles.badgeText, { color: theme.colors.primaryNavy }]}>
              INSTANT LOG
            </Text>
          </View>
        )}
      </View>

      {/* Input Box */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.mutedSurface,
            borderColor: focused
              ? theme.colors.secondaryTeal
              : theme.colors.border,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.secondaryText}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          style={[styles.input, { color: theme.colors.primaryText }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log activity message"
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: hasText
                ? theme.colors.secondaryTeal
                : theme.colors.primaryNavy,
              opacity: pressed ? 0.85 : hasText ? 1 : 0.45,
            },
          ]}
        >
          <Send size={15} color="#FFFFFF" />
          <Text style={styles.sendLabel}>Log</Text>
        </Pressable>
      </View>

      {/* Quick 1-Tap Presets */}
      <View style={styles.chipsSection}>
        <Text style={[styles.chipsHeader, { color: theme.colors.secondaryText }]}>
          QUICK TAP
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {suggestions.map((item) => (
            <Pressable
              key={item}
              onPress={() => onSubmitMessage(item)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: theme.colors.mutedSurface,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <SuggestionIcon label={item} color={theme.colors.secondaryTeal} />
              <Text style={[styles.chipText, { color: theme.colors.primaryText }]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 15,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 11,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingLeft: SPACING.md,
    paddingRight: 5,
    paddingVertical: 5,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 13.5,
    paddingVertical: 6,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    height: 38,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
  },
  sendLabel: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  chipsSection: {
    gap: 6,
  },
  chipsHeader: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  chipsRow: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
});
