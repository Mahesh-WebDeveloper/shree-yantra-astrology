import React from 'react';
import { View, Text, ScrollView } from 'react-native';

interface State {
  error: Error | null;
}

/**
 * Top-level safety net: instead of a silent black screen on a startup crash,
 * show the actual error/stack so issues are diagnosable on-device.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // surfaced in `adb logcat` / EAS device logs
    console.log('[ShreeYantra] startup error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000000', padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: '#f6d27a', fontSize: 18, fontWeight: '700', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <ScrollView style={{ maxHeight: 360 }}>
            <Text style={{ color: '#ff9d9d', fontSize: 13, lineHeight: 19 }}>
              {String(error?.message || error)}
            </Text>
            <Text style={{ color: '#9c916f', fontSize: 11, lineHeight: 16, marginTop: 12 }}>
              {String((error as any)?.stack || '')}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
