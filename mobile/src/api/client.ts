import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// A physical Android device has no equivalent of the emulator's 10.0.2.2 alias, so it
// needs the Mac's real LAN IP instead — set this (find it via `ipconfig getifaddr en0`
// on the Mac) whenever running on real hardware, and clear it back to '' for emulator use.
const PHYSICAL_ANDROID_DEVICE_HOST = '192.168.29.154';

// Android emulator maps the host machine's localhost to 10.0.2.2. iOS's physical-device
// USB connection already forwards `localhost` to the Mac on its own, so it needs no override.
const DEV_HOST =
  Platform.OS === 'android' ? PHYSICAL_ANDROID_DEVICE_HOST || '10.0.2.2' : 'localhost';
export const API_BASE_URL = `http://${DEV_HOST}:4000/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Something went wrong';
  }
  return 'Something went wrong';
}
