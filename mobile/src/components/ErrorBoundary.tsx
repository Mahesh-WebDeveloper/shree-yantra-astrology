import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface State {
  error: Error | null;
  hi: boolean;
}

/**
 * Top-level safety net: instead of a silent black screen on a startup crash,
 * show the actual error/stack so issues are diagnosable on-device.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, hi: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidMount() {
    // class component can't use hooks — read persisted language directly
    AsyncStorage.getItem('sy.lang').then((v) => { if (v === 'hi') this.setState({ hi: true }); }).catch(() => {});
  }

  componentDidCatch(error: Error, info: unknown) {
    // surfaced in `adb logcat` / EAS device logs
    console.log('[ShreeYantra] startup error:', error, info);
  }

  render() {
    const { error, hi } = this.state;
    if (error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000000', padding: 24, justifyContent: 'center' }}>
          <Text style={{ color: '#f6d27a', fontSize: 18, fontWeight: '700', marginBottom: 10 }}>
            {hi ? 'कुछ गड़बड़ हो गई' : 'Something went wrong'}
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
