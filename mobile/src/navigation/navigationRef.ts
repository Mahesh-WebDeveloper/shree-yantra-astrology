import { createNavigationContainerRef } from '@react-navigation/native';

/** Single navigation ref so the custom drawer (rendered outside the navigators)
    can drive navigation and read the focused route. */
export const navigationRef = createNavigationContainerRef<any>();

export function navTo(name: string, params?: object) {
  if (navigationRef.isReady()) (navigationRef as any).navigate(name, params);
}

/** Name of the currently focused route (tab name or stack screen name). */
export function currentRouteName(): string | undefined {
  if (!navigationRef.isReady()) return undefined;
  return navigationRef.getCurrentRoute()?.name;
}
