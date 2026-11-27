import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import { QUICK_ACTIVITY_SUGGESTIONS } from '../constants';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

interface ActivityMessageInputProps {
  onSubmitMessage: (message: string) => void;
  suggestions?: string[];
  activeSessions?: string[];
  placeholder?: string;
}

export function ActivityMessageInput({
  onSubmitMessage,
  suggestions = QUICK_ACTIVITY_SUGGESTIONS,
  activeSessions = [],
  placeholder = 'Type e.g. "Wake Up", "Workout Start", "Water 250ml"...',
}: ActivityMessageInputProps) {
  const theme = useAppTheme();
  const [text, setText] = useState('');

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
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Sparkles size={16} color={theme.colors.secondaryTeal} />
          <Text style={[styles.title, { color: theme.colors.primaryText }]}>
            Quick Activity Message
          </Text>
        </View>
        {activeSessions.length > 0 ? (
          <View
            style={[styles.activePill, { backgroundColor: theme.colors.tealTint }]}
          >
            <Text style={[styles.activePillText, { color: theme.colors.secondaryTeal }]}>
              Active: {activeSessions.join(', ')}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.mutedSurface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
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
              backgroundColor: text.trim()
                ? theme.colors.secondaryTeal
                : theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Send size={18} color="#FFFFFF" />
        </Pressable>
      </View>

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
                backgroundColor: theme.colors.tealTint,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: theme.colors.primaryText }]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 14,
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  activePillText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 11,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingLeft: SPACING.md,
    paddingRight: 6,
    paddingVertical: 4,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 14,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    gap: SPACING.sm,
    paddingTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  chipText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 12,
  },
});
