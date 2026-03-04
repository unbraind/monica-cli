import type { MonicaConfig } from '../types';
import * as api from '../api';

export async function verifyConfigConnection(settings: Partial<MonicaConfig>): Promise<Awaited<ReturnType<typeof api.getUser>>> {
  const missing: string[] = [];
  if (!settings.apiUrl) missing.push('API URL');
  if (!settings.apiKey) missing.push('API key');
  if (missing.length > 0) {
    throw new Error(`Cannot verify connection: missing ${missing.join(' and ')}`);
  }

  api.setConfig({
    apiUrl: settings.apiUrl!,
    apiKey: settings.apiKey!,
    userEmail: settings.userEmail,
    userPassword: settings.userPassword,
    readOnlyMode: settings.readOnlyMode,
  });

  try {
    return await api.getUser();
  } catch (error) {
    throw new Error(`Connection to ${settings.apiUrl} failed: ${(error as Error).message}`);
  }
}
