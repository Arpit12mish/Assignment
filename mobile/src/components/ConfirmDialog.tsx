import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors, radius, shadow, spacing, typography } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// A themed stand-in for Alert.alert — the OS dialog (Material on Android, UIKit on iOS)
// looks like a completely different app next to this one's red/white branding, and
// renders inconsistently between platforms besides. Used for every confirm/destructive
// prompt (logout, delete) so they all match the rest of the UI.
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <AppButton label={cancelLabel} variant="secondary" onPress={onCancel} style={styles.button} />
            <AppButton
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});
