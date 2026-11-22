import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ui } from '../theme';

// Popup bawah dengan transisi halus: latar memudar (fade), kartu naik pelan sambil memudar.
type Props = { visible: boolean; onClose: () => void; children: React.ReactNode; sheetStyle?: ViewStyle };

export default function Sheet({ visible, onClose, children, sheetStyle }: Props) {
  const [mounted, setMounted] = useState(visible);
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(t, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(t, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(32,35,29,0.35)', opacity: t }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <Animated.View style={[ui.sheet, { opacity: t, transform: [{ translateY }] }, sheetStyle]}>{children}</Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
