import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { AUTH_STORAGE_KEY, LEGACY_AUTH_STORAGE_KEY } from "../utils/constants";

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function readSessionRaw(): Promise<string | null> {
  if (await canUseSecureStore()) {
    try {
      return await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    } catch {
      // Si SecureStore falla, se usa AsyncStorage como respaldo.
    }
  }

  return AsyncStorage.getItem(AUTH_STORAGE_KEY);
}

export async function writeSessionRaw(value: string): Promise<void> {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, value);
      return;
    } catch {
      // Si SecureStore falla, se usa AsyncStorage como respaldo.
    }
  }

  await AsyncStorage.setItem(AUTH_STORAGE_KEY, value);
}

export async function clearSessionStorage(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => undefined);
  await AsyncStorage.removeItem(LEGACY_AUTH_STORAGE_KEY).catch(() => undefined);

  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY).catch(() => undefined);
  }
}

export async function clearLegacySessionStorage(): Promise<void> {
  await AsyncStorage.removeItem(LEGACY_AUTH_STORAGE_KEY).catch(() => undefined);
}
