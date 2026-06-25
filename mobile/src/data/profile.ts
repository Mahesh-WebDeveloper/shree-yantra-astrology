/**
 * Profile content — ported 1:1 from the web prototype
 * (pages/profile-page/index.html).
 */

export const PROFILE = {
  name: 'Raj Kumar',
  meta: 'Leo ♌ · Member since Mar 2024',
  email: 'raj.kumar@cosmos.com',
};

export const STATS = [
  { num: '28', label: 'Predictions' },
  { num: '04', label: 'Consults' },
  { num: '62', label: 'Premium Days' },
];

export interface InfoItem {
  icon: 'user' | 'calendar' | 'clock' | 'pin' | 'mail';
  label: string;
  value: string;
}

export const INFO: InfoItem[] = [
  { icon: 'user', label: 'Full Name', value: 'Raj Kumar' },
  { icon: 'calendar', label: 'Date of Birth', value: '01 Jan 2000' },
  { icon: 'clock', label: 'Time of Birth', value: '06:42 AM' },
  { icon: 'pin', label: 'Place of Birth', value: 'Jaipur, Rajasthan' },
  { icon: 'mail', label: 'Email', value: 'raj.kumar@cosmos.com' },
];

export type RowIcon =
  | 'edit' | 'bell' | 'crown' | 'bookmark' | 'globe' | 'lock' | 'help';

export interface MenuItem {
  icon: RowIcon;
  label: string;
  sub: string;
  /** present → chevron; absent → control rendered by the screen */
  chevron?: boolean;
  toggle?: boolean;
}

export const ACCOUNT: MenuItem[] = [
  { icon: 'edit', label: 'Edit Profile', sub: 'Update your details & birth info', chevron: true },
  { icon: 'bell', label: 'Notifications', sub: 'Predictions & account alerts', chevron: true },
  { icon: 'crown', label: 'Manage Subscription', sub: 'Premium · Next billing 24 Jun', chevron: true },
  { icon: 'bookmark', label: 'Saved Library', sub: 'Books, mantras and listening history', chevron: true },
];

export const PREFERENCES: MenuItem[] = [
  { icon: 'bell', label: 'Notifications', sub: 'Daily predictions & reminders', toggle: true },
  { icon: 'globe', label: 'Language', sub: 'English', chevron: true },
  { icon: 'lock', label: 'Privacy & Security', sub: 'Password, data, account', chevron: true },
  { icon: 'help', label: 'Help & Support', sub: 'FAQ, contact, feedback', chevron: true },
];

export const VERSION = 'SHREE YANTRA · ASTROLOGY v1.0.0';
