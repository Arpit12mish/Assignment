import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../theme';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: readonly Edge[];
}

// Every screen's root container. react-navigation's native-stack only reserves space
// for the status bar/notch when it renders its own header — every screen in this app
// sets headerShown: false and draws its own heading instead, so without this, top
// content collides with the status bar/Dynamic Island and bottom content collides with
// the home indicator. Defaults to both edges; pass `edges` to override (e.g. a screen
// already inside a KeyboardAvoidingView that only needs the top inset).
export default function Screen({ children, style, edges = ['top', 'bottom'] }: Props) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
