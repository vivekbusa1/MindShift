import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePickerNative, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';
import { PrimaryButton } from './Buttons';

interface DateTimePickerFieldProps {
  label: string;
  value: Date;
  mode: 'date' | 'time' | 'datetime';
  maximumDate?: Date;
  minimumDate?: Date;
  onChange: (nextDate: Date) => void;
}

export function DateTimePickerField({
  label,
  value,
  mode,
  maximumDate,
  minimumDate,
  onChange,
}: DateTimePickerFieldProps) {
  const theme = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>(
    mode === 'datetime' ? 'date' : mode
  );

  const formattedValue =
    mode === 'time'
      ? value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : mode === 'date'
      ? value.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : value.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

  const handleOpen = () => {
    setAndroidStep(mode === 'datetime' ? 'date' : mode);
    setShowPicker(true);
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setShowPicker(false);
        return;
      }
      if (selected) {
        if (mode === 'datetime' && androidStep === 'date') {
          const merged = new Date(value);
          merged.setFullYear(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate()
          );
          onChange(merged);
          setAndroidStep('time');
          return;
        }
        onChange(selected);
      }
      setShowPicker(false);
      return;
    }

    if (selected) {
      onChange(selected);
    }
  };

  // Web fallback quick steppers if opened on expo web
  const adjustMinutes = (deltaMins: number) => {
    const next = new Date(value.getTime() + deltaMins * 60000);
    if (maximumDate && next > maximumDate) return;
    if (minimumDate && next < minimumDate) return;
    onChange(next);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.primaryText }]}>{label}</Text>
      <Pressable
        onPress={handleOpen}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.colors.white,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {mode === 'time' ? (
          <Clock size={18} color={theme.colors.secondaryTeal} />
        ) : (
          <CalendarIcon size={18} color={theme.colors.secondaryTeal} />
        )}
        <Text style={[styles.valueText, { color: theme.colors.primaryText }]}>
          {formattedValue}
        </Text>
      </Pressable>

      {showPicker && Platform.OS !== 'web' ? (
        <View
          style={[
            styles.pickerBox,
            {
              backgroundColor: theme.colors.white,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <DateTimePickerNative
            value={value}
            mode={Platform.OS === 'android' ? androidStep : mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <PrimaryButton
              title="Done"
              onPress={() => setShowPicker(false)}
              style={styles.doneBtn}
            />
          ) : null}
        </View>
      ) : null}

      {showPicker && Platform.OS === 'web' ? (
        <View
          style={[
            styles.webStepper,
            {
              backgroundColor: theme.colors.mutedSurface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Pressable onPress={() => adjustMinutes(-60)} style={styles.stepChip}>
            <Text style={[styles.stepText, { color: theme.colors.primaryText }]}>-1h</Text>
          </Pressable>
          <Pressable onPress={() => adjustMinutes(-15)} style={styles.stepChip}>
            <Text style={[styles.stepText, { color: theme.colors.primaryText }]}>-15m</Text>
          </Pressable>
          <Pressable onPress={() => adjustMinutes(15)} style={styles.stepChip}>
            <Text style={[styles.stepText, { color: theme.colors.primaryText }]}>+15m</Text>
          </Pressable>
          <Pressable onPress={() => adjustMinutes(60)} style={styles.stepChip}>
            <Text style={[styles.stepText, { color: theme.colors.primaryText }]}>+1h</Text>
          </Pressable>
          <Pressable onPress={() => setShowPicker(false)} style={styles.stepChip}>
            <Text style={[styles.stepText, { color: theme.colors.secondaryTeal }]}>Done</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 13,
  },
  trigger: {
    minHeight: 48,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  valueText: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: 14,
  },
  pickerBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    marginTop: 4,
  },
  doneBtn: {
    marginTop: SPACING.sm,
  },
  webStepper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  stepChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepText: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 13,
  },
});
