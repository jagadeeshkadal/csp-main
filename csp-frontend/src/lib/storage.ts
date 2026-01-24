/**
 * Utility functions for managing user data in localStorage
 */

export interface UserData {
  id: string;
  phoneNumber: string;
  phoneExtension: string;
  name?: string | null;
  email?: string | null;
  jwt?: string | null;
}

/**
 * Get user ID from localStorage
 */
export const getUserId = (): string | null => {
  return localStorage.getItem('userId');
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): UserData | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as UserData;
  } catch (e) {
    console.error('Failed to parse user data:', e);
    return null;
  }
};

/**
 * Get JWT token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const userId = getUserId();
  return !!(token && userId);
};

/**
 * Clear all user data from localStorage
 */
export const clearUserData = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userPhoneNumber');
  localStorage.removeItem('userPhoneExtension');
};
