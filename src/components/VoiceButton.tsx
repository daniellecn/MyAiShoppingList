import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  isListening: boolean;
  onPress: () => void;
  size?: number;
}

export function VoiceButton({ isListening, onPress, size = 40 }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isListening, pulse]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.btn,
          { width: size, height: size, borderRadius: size / 2 },
          isListening && styles.listening,
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.icon, { fontSize: size * 0.45 }]}>{isListening ? '⏹' : '🎙'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  listening: {
    backgroundColor: Colors.danger,
  },
  icon: { textAlign: 'center' },
});
