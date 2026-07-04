import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeProvider';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import { Blueprint } from '../lib/vastuBlueprint';
import { blueprintHtml } from '../lib/blueprintHtml';

/** Premium HTML+SVG floor plan rendered inside a WebView (soft shadows, gradients, fonts). */
export function BlueprintWeb({ bp, mandala = false, height = 430 }: { bp: Blueprint; mandala?: boolean; height?: number }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const html = blueprintHtml(bp, lang === 'hi', theme.isDark, mandala);
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
      />
    </View>
  );
}

/** Fullscreen, pinch-zoomable floor plan. */
export function BlueprintWebFullscreen({ bp, mandala, visible, onClose }: { bp: Blueprint; mandala?: boolean; visible: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const html = blueprintHtml(bp, hi, theme.isDark, mandala);
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.wrap}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#0a0a06' }}
          scalesPageToFit
          setBuiltInZoomControls
          setDisplayZoomControls={false}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.bar}>
          <Text style={styles.hint}>{hi ? 'दो उँगलियों से ज़ूम करें' : 'Pinch to zoom'}</Text>
          <Pressable onPress={() => { hTap(); onClose(); }} style={styles.close}><Text style={styles.closeTxt}>✕ {hi ? 'बंद' : 'Close'}</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0a0a06' },
  bar: { position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  hint: { color: 'rgba(252,232,168,0.6)', fontSize: 12 },
  close: { backgroundColor: '#e9b850', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  closeTxt: { color: '#1a1206', fontWeight: '700', fontSize: 14 },
});
