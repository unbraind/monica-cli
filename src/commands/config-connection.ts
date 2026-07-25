import type { AccountUser, ApiResponse, MonicaConfig, User } from '../types';
import * as api from '../api';

/** Executes the verify config connection operation. */
export async function verifyConfigConnection(
  settings: Partial<MonicaConfig>,
): Promise<ApiResponse<User | AccountUser>> {
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
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (
      statusCode === 404
      || statusCode === 405
    ) {
      try {
        return await api.getAuthenticatedUser();
      } catch (nextError) {
        throw new Error(
          `Connection to ${settings.apiUrl} failed for stable and next API editions: ${(nextError as Error).message}`,
          { cause: nextError },
        );
      }
    }
    throw new Error(
      `Connection to ${settings.apiUrl} failed: ${(error as Error).message}`,
      { cause: error },
    );
  }
}
