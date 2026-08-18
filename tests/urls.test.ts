import { describe, it, expect } from 'vitest';
import {
  normalizeInviteUrl,
  platformIdentityKey,
  detectPlatform,
} from '../src/lib/urls';

describe('normalizeInviteUrl', () => {
  it('trims whitespace and normalizes scheme', () => {
    expect(normalizeInviteUrl('  t.me/example  ')).toBe('https://t.me/example');
    expect(normalizeInviteUrl('telegram.me/example')).toBe('https://telegram.me/example');
  });

  it('lowercases telegram usernames (case-insensitive)', () => {
    expect(normalizeInviteUrl('https://T.ME/ExampleChannel')).toBe('https://t.me/examplechannel');
  });

  it('preserves discord invite token case', () => {
    expect(normalizeInviteUrl('https://discord.gg/AbCdEf12')).toBe('https://discord.gg/AbCdEf12');
  });

  it('preserves whatsapp group code case', () => {
    expect(normalizeInviteUrl('https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQr')).toBe(
      'https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQr'
    );
  });

  it('strips tracking parameters', () => {
    expect(normalizeInviteUrl('https://t.me/example?utm_source=twitter&utm_medium=link&start=x')).toBe(
      'https://t.me/example?start=x'
    );
    expect(normalizeInviteUrl('https://discord.gg/abc?fbclid=xyz&ref=abc')).toBe('https://discord.gg/abc');
  });

  it('strips fragments', () => {
    expect(normalizeInviteUrl('https://t.me/example#section')).toBe('https://t.me/example');
  });

  it('rejects invalid input', () => {
    expect(normalizeInviteUrl('')).toBeNull();
    expect(normalizeInviteUrl('not a url')).toBeNull();
    expect(normalizeInviteUrl('ftp://t.me/example')).toBeNull();
  });
});

describe('platformIdentityKey', () => {
  it('unifies t.me and telegram.me forms', () => {
    const a = platformIdentityKey('telegram', 'https://t.me/example');
    const b = platformIdentityKey('telegram', 'https://telegram.me/example');
    expect(a).toBe(b);
  });

  it('extracts discord invite code', () => {
    expect(platformIdentityKey('discord', 'https://discord.gg/abcDEF123')).toBe('discord:abcDEF123');
    expect(platformIdentityKey('discord', 'https://discord.com/invite/abcDEF123')).toBe(
      'discord:abcDEF123'
    );
  });

  it('extracts whatsapp code without modifying it', () => {
    expect(platformIdentityKey('whatsapp', 'https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQr')).toBe(
      'whatsapp:AbCdEfGhIjKlMnOpQr'
    );
  });

  it('returns null for unparseable URLs', () => {
    expect(platformIdentityKey('telegram', 'https://example.com/foo')).toBeNull();
  });
});

describe('detectPlatform', () => {
  it('detects each platform from its hostname patterns', () => {
    expect(detectPlatform('https://t.me/example')).toBe('telegram');
    expect(detectPlatform('https://chat.whatsapp.com/abc')).toBe('whatsapp');
    expect(detectPlatform('https://discord.gg/abc')).toBe('discord');
    expect(detectPlatform('https://discord.com/invite/abc')).toBe('discord');
  });

  it('returns undefined for unknown hosts', () => {
    expect(detectPlatform('https://example.com/x')).toBeUndefined();
  });
});
