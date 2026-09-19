import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// A lightweight stand-in for Google's "G" mark — avoids pulling in an SVG/icon library
// for a single glyph. Not pixel-accurate to the official logo, just a recognizable cue.
export default function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.62 }]}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '800',
    color: '#4285F4',
  },
});
