import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, spacing, radius } from '../../constants/theme';

interface Props { children: ReactNode; height?: number }
interface State { hasError: boolean }

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.fallback, this.props.height ? { height: this.props.height } : {}]}>
          <Text style={styles.text}>Mappa non disponibile</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  text: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
  },
});
