export const PROFILE_PREFERENCES_KEY = 'beattheice-shell-profile';

export function loadProfilePreferences() {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(PROFILE_PREFERENCES_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function saveProfilePreferences(preferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROFILE_PREFERENCES_KEY, JSON.stringify(preferences));
}
