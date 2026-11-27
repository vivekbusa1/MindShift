import { STORAGE_KEYS } from '../../constants';
import { storageService } from '../../services/storageService';
import { AuthSession, LocalAccount } from '../../types';
import { generateSalt, hashLocalPassword, verifyLocalPassword } from '../../utils/crypto';
import { createId } from '../../utils/date';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return 'Email address is required.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export const localAuthService = {
  async getAccounts(): Promise<LocalAccount[]> {
    const accounts = await storageService.getItem<LocalAccount[]>(STORAGE_KEYS.ACCOUNTS);
    return accounts ?? [];
  },

  async registerLocalAccount(params: {
    email: string;
    password: string;
  }): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
    const email = params.email.trim().toLowerCase();
    const emailErr = validateEmail(email);
    if (emailErr) return { ok: false, error: emailErr };

    const passErr = validatePassword(params.password);
    if (passErr) return { ok: false, error: passErr };

    const accounts = await this.getAccounts();
    if (accounts.some((a) => a.email === email)) {
      return {
        ok: false,
        error: 'A local account with this email already exists on this device. Please sign in.',
      };
    }

    const salt = generateSalt();
    const passwordHash = hashLocalPassword(params.password, salt);
    const newAccount: LocalAccount = {
      id: createId('user'),
      email,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    await storageService.setItem(STORAGE_KEYS.ACCOUNTS, [...accounts, newAccount]);

    const session: AuthSession = {
      userId: newAccount.id,
      email: newAccount.email,
      isDemoMode: false,
      hasSeenOnboarding: true,
      hasCompletedProfileSetup: false,
      hasCompletedGoalSetup: false,
      lastSignedInAt: new Date().toISOString(),
    };
    await storageService.setItem(STORAGE_KEYS.SESSION, session);
    return { ok: true, session };
  },

  async signInLocalAccount(params: {
    email: string;
    password: string;
  }): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
    const email = params.email.trim().toLowerCase();
    const emailErr = validateEmail(email);
    if (emailErr) return { ok: false, error: emailErr };

    const passErr = validatePassword(params.password);
    if (passErr) return { ok: false, error: passErr };

    const accounts = await this.getAccounts();
    const found = accounts.find((a) => a.email === email);
    if (!found) {
      return {
        ok: false,
        error: 'No local account found for this email on this device. Register or use Demo Mode.',
      };
    }

    if (!verifyLocalPassword(params.password, found.salt, found.passwordHash)) {
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }

    const existingSession = await storageService.getItem<AuthSession>(STORAGE_KEYS.SESSION);
    const session: AuthSession = {
      userId: found.id,
      email: found.email,
      isDemoMode: false,
      hasSeenOnboarding: true,
      hasCompletedProfileSetup: existingSession?.userId === found.id ? existingSession.hasCompletedProfileSetup : true,
      hasCompletedGoalSetup: existingSession?.userId === found.id ? existingSession.hasCompletedGoalSetup : true,
      lastSignedInAt: new Date().toISOString(),
    };
    await storageService.setItem(STORAGE_KEYS.SESSION, session);
    return { ok: true, session };
  },

  async resetLocalPassword(params: {
    email: string;
    newPassword: string;
  }): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
    const email = params.email.trim().toLowerCase();
    const emailErr = validateEmail(email);
    if (emailErr) return { ok: false, error: emailErr };

    const passErr = validatePassword(params.newPassword);
    if (passErr) return { ok: false, error: passErr };

    const accounts = await this.getAccounts();
    const idx = accounts.findIndex((a) => a.email === email);
    if (idx === -1) {
      return {
        ok: false,
        error: 'No local account exists for this email on this device. Phase 1 does not send reset emails.',
      };
    }

    const salt = generateSalt();
    const passwordHash = hashLocalPassword(params.newPassword, salt);
    const updated = [...accounts];
    updated[idx] = { ...updated[idx], salt, passwordHash };
    await storageService.setItem(STORAGE_KEYS.ACCOUNTS, updated);

    return {
      ok: true,
      message: 'Local account password updated on this device (Phase 1 offline mode; no email was sent).',
    };
  },
};
