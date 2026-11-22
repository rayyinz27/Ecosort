import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK } from '../theme';

export default function ScreenHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <View style={ui.header}>
      <View style={{ flex: 1 }}>
        <Text style={ui.brand}>{title}</Text>
        {subtitle ? <Text style={ui.subtitle}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity style={ui.roundIcon} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={DARK} />
      </TouchableOpacity>
    </View>
  );
}
