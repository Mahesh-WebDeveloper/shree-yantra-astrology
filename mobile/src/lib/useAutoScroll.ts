import { useRef } from 'react';

/**
 * Auto-scroll a <Page>/scroll view to its results after a search/generate completes,
 * so the freshly-loaded response is brought into view instead of staying below the fold.
 *
 * Usage:
 *   const { scrollRef, onResultsLayout, scrollToResults } = useAutoScroll();
 *   <Page scrollRef={scrollRef}> … <View onLayout={onResultsLayout}>{result}</View> … </Page>
 *   // after setResult(...) succeeds:  scrollToResults();
 */
export function useAutoScroll() {
  const scrollRef = useRef<any>(null);
  const y = useRef(0);

  const onResultsLayout = (e: any) => {
    const ly = e?.nativeEvent?.layout?.y;
    if (typeof ly === 'number') y.current = ly;
  };

  const scrollToResults = (delay = 320) => {
    setTimeout(() => {
      const s = scrollRef.current;
      if (!s) return;
      const yy = Math.max(0, y.current - 10);
      // KeyboardAwareScroll exposes scrollToPosition; a plain ScrollView exposes scrollTo.
      if (typeof s.scrollToPosition === 'function') s.scrollToPosition(0, yy, true);
      else if (typeof s.scrollTo === 'function') s.scrollTo({ y: yy, animated: true });
      else if (s.getScrollResponder && s.getScrollResponder()?.scrollTo) s.getScrollResponder().scrollTo({ y: yy, animated: true });
    }, delay);
  };

  return { scrollRef, onResultsLayout, scrollToResults };
}
