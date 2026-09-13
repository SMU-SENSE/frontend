const AAC_USER_ID_KEY = 'malmoa_aac_user_id';
const DEVICE_TOKEN_KEY = 'malmoa_device_token';

export const storage = {
  getAacUserId: (): number | null => {
    if (typeof window === 'undefined') return null;
    const id = localStorage.getItem(AAC_USER_ID_KEY);
    return id ? Number(id) : null;
  },

  setAacUserId: (id: number): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AAC_USER_ID_KEY, String(id));
  },

  getDeviceToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  },

  setDeviceToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  },

  clearDevice: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AAC_USER_ID_KEY);
    localStorage.removeItem(DEVICE_TOKEN_KEY);
  },
};